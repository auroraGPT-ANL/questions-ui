import os
import math
import transformers 
from openai import OpenAI
from typing import List, Tuple, Any

os.environ["TOKENIZERS_PARALLELISM"] = "false"

def encode_pair(
    tokenizer: Any, 
    context: str, 
    continuation: str
):
    """
    Encode a pair of context and continuation into token IDs.
    Note: We need to move the space at the end of the context 
    to the beginning of the continuation.

    :param tokenizer: the tokenizer object.
    :param context: the context string (i.e. prompt+question).
    :param continuation: the continuation string (i.e. answer).
    """
    n_spaces = len(context) - len(context.rstrip())
    if n_spaces > 0:
        continuation = context[-n_spaces:] + continuation
        context = context[:-n_spaces]
    whole_enc = tokenizer.encode(context + continuation)
    context_enc = tokenizer.encode(context)
    context_enc_len = len(context_enc)
    continuation_enc = whole_enc[context_enc_len:]
    return context_enc, continuation_enc

def get_loglikelihood(
    client: OpenAI,
    question: str,
    answer: str,
    model: str,
    tokenizer: Any,
) -> float:
    """
    Return the loglikelihood of a certain answer given the question.
    """
    context = f"You are a friendly and helpful AI assistant. Please help me to answer the following question.\n\nQuestion {question}\n\nAnswer: "
    continuation = answer
    context_enc, continuation_enc = encode_pair(tokenizer, context, continuation)
    completion = client.completions.create(
        model=model,
        prompt=context_enc + continuation_enc,
        echo=True,
        max_tokens=0,
        temperature=0.0,
        logprobs=5,
        seed=42,
    )
    token_logprobs = completion.choices[0].logprobs.token_logprobs
    loglikelihood = sum(token_logprobs[len(context_enc):])
    return loglikelihood

def test_question(
    api_base_url: str,
    model: str,
    question: str,
    correct_answer: str,
    incorrect_answers: List[str],
) -> Tuple[bool, float]:
    """
    Test a question and a series of answers against a model, and return whether 
    the model can choose the correct answer and the relative probability of the 
    correct answer as a float score number in [0, 1].

    :param api_base_url: the base URL of a OpenAI-API-Compatible server.
    :param model: the model name in the server.
    :param question: the question string.
    :param correct_answer: the correct answer string.
    :param incorrect_answers: a list of incorrect answer strings.

    :return answer_correctly: whether the model can choose the correct answer or not
    :return score: a float number in [0, 1] indicating the relative probability of the correct answer
    """
    tokenizer = transformers.AutoTokenizer.from_pretrained(model)
    client = OpenAI(base_url=api_base_url)

    correct_loglikelihood = get_loglikelihood(client, question, correct_answer, model, tokenizer)

    incorrect_loglikelihoods = [
        get_loglikelihood(client, question, incorrect_answer, model, tokenizer)
        for incorrect_answer in incorrect_answers
    ]

    answer_correctly = correct_loglikelihood > max(incorrect_loglikelihoods)
    score = math.exp(correct_loglikelihood) / (sum([math.exp(loglikelihood) for loglikelihood in incorrect_loglikelihoods]) + math.exp(correct_loglikelihood))

    print(f"Correct loglikelihood: {correct_loglikelihood}")
    print(f"Incorrect loglikelihoods: {incorrect_loglikelihoods}")

    return answer_correctly, score


"""Test the function"""
if __name__ == "__main__":
    api_base_url = "http://localhost:8000/v1"
    model = "meta-llama/Llama-2-7b-hf"
    print("==============================================")
    question = "What is the capital of France?"
    correct_answer = "Paris"
    incorrect_answers = ["London", "Berlin", "Madrid"]
    print(f"Question: {question}")
    print(f"Correct answer: {correct_answer}")
    print(f"Incorrect answers: {incorrect_answers}")
    answer_correctly, score = test_question(api_base_url, model, question, correct_answer, incorrect_answers)
    print(f"Answer correctly: {answer_correctly}")
    print(f"Score: {score}")
    print("==============================================")
    question = "Where is Argonne National Laboratory located?"
    correct_answer = "Lemont, Illinois"
    incorrect_answers = ["New York, New York", "Los Angeles, California", "Champaign, Illinois"]
    print(f"Question: {question}")
    print(f"Correct answer: {correct_answer}")
    print(f"Incorrect answers: {incorrect_answers}")
    answer_correctly, score = test_question(api_base_url, model, question, correct_answer, incorrect_answers)
    print(f"Answer correctly: {answer_correctly}")
    print(f"Score: {score}")
    print("==============================================")
    question = "What is machine learning?"
    correct_answer = "Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed."
    incorrect_answers = [
        "Machine learning is a machine that can learn how to do anything.",
        "Machine learning is a subset of mechanical engineering.",
    ]
    print(f"Question: {question}")
    print(f"Correct answer: {correct_answer}")
    print(f"Incorrect answers: {incorrect_answers}")
    answer_correctly, score = test_question(api_base_url, model, question, correct_answer, incorrect_answers)
    print(f"Answer correctly: {answer_correctly}")
    print(f"Score: {score}")
    print("==============================================")


"""
Sample outputs to the above test cases:
==============================================
Question: What is the capital of France?
Correct answer: Paris
Incorrect answers: ['London', 'Berlin', 'Madrid']
Correct loglikelihood: -0.8237540125846863
Incorrect loglikelihoods: [-5.507347583770752, -5.804222583770752, -7.778831958770752]
Answer correctly: True
Score: 0.9832161552674344
==============================================
Question: Where is Argonne National Laboratory located?
Correct answer: Lemont, Illinois
Incorrect answers: ['New York, New York', 'Los Angeles, California', 'Champaign, Illinois']
Correct loglikelihood: -13.957975372672081
Incorrect loglikelihoods: [-11.717722415924072, -10.848501920700073, -9.38187937438488]
Answer correctly: False
Score: 0.007695895788592497
==============================================
Question: What is machine learning?
Correct answer: Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.
Incorrect answers: ['Machine learning is a machine that can learn how to do anything.', 'Machine learning is a subset of mechanical engineering.']
Correct loglikelihood: -11.542558703338727
Incorrect loglikelihoods: [-23.30599206313491, -20.439436744898558]
Answer correctly: True
Score: 0.9998554214602303
==============================================
"""