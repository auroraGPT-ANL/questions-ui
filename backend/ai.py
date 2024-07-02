import asyncio
import math
from openai import AsyncOpenAI, types
from typing import Tuple, List, cast
from config import LLM_API_BASE_URL, BACKEND_READY, MODEL_NAME_MAP

ASYNC_LLM_CLIENT = AsyncOpenAI(base_url=LLM_API_BASE_URL, api_key='EMPTY')

async def get_loglikelihood_async(
    client: AsyncOpenAI,
    question: str,
    answer: str,
    model: str,
) -> Tuple[float, int]:
    """
    Return the loglikelihood of a certain answer given the question in an asynchronous way.
    """
    context = f"You are a friendly and helpful AI assistant. Please help me to answer the following question.\n\nQuestion {question}\n\nAnswer:"
    continuation = f" {answer.strip()}"
    # Obtain the number of tokens in the context
    context_echo = await client.completions.create(
        model=model,
        prompt=context,
        echo=True,
        max_tokens=0,
        temperature=0.0,
        logprobs=1,
    )
    context_num_tokens = len(cast(list[float], cast(types.completion_choice.Logprobs, context_echo.choices[0].logprobs).token_logprobs))
    # Get the completion for the whole query
    completion = await client.completions.create(
        model=model,
        prompt=context + continuation,
        echo=True,
        max_tokens=0,
        temperature=0.0,
        logprobs=1,
    )
    token_logprobs = cast(list[float], cast(types.completion_choice.Logprobs, completion.choices[0].logprobs).token_logprobs)
    loglikelihood = sum(token_logprobs[context_num_tokens:])/len(token_logprobs[context_num_tokens:])
    return loglikelihood, len(token_logprobs[context_num_tokens:])

async def test_question_impl(
        model: str,
        question: str,
        correct_answer: str,
        incorrect_answers: List[str],
        ) -> Tuple[bool,float, str, str]:
    if BACKEND_READY:
        model = MODEL_NAME_MAP[model]
        correct_loglikelihood, correct_token_count = await get_loglikelihood_async(ASYNC_LLM_CLIENT, question, correct_answer, model)
        incorrect_responses = await asyncio.gather(
            *[get_loglikelihood_async(ASYNC_LLM_CLIENT, question, incorrect_answer, model) for incorrect_answer in incorrect_answers]
        )
        incorrect_loglikelihoods, incorrect_token_counts = [r[0] for r in incorrect_responses], [r[1] for r in incorrect_responses]
        avg_token_count = (correct_token_count + sum(incorrect_token_counts)) / (len(incorrect_token_counts) + 1)
        answer_correctly = correct_loglikelihood > max(incorrect_loglikelihoods)
        score = math.exp(correct_loglikelihood*avg_token_count) / (sum([math.exp(loglikelihood*avg_token_count) for loglikelihood in incorrect_loglikelihoods]) + math.exp(correct_loglikelihood*avg_token_count))
        correct_log_str = f'{correct_loglikelihood:.2f}'
        incorrect_logs_str = ",".join([f'{loglikelihood:.2f}' for loglikelihood in incorrect_loglikelihoods])

        return answer_correctly, score, correct_log_str, incorrect_logs_str
    else:
        return False, 0.0, "", ""

