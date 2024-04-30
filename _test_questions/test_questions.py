import math
from openai import OpenAI
from typing import List, Tuple

def get_loglikelihood(
    client: OpenAI,
    question: str,
    answer: str,
    model: str,
) -> float:
    """
    Return the loglikelihood of a certain answer given the question.
    """
    context = f"You are a friendly and helpful AI assistant. Please help me to answer the following question.\n\nQuestion {question}\n\nAnswer:"
    continuation = f" {answer.strip()}"
    # Obtain the number of tokens in the context
    context_echo = client.completions.create(
        model=model,
        prompt=context,
        echo=True,
        max_tokens=0,
        temperature=0.0,
        logprobs=1,
    )
    context_num_tokens = len(context_echo.choices[0].logprobs.token_logprobs)
    # Get the completion for the whole query
    completion = client.completions.create(
        model=model,
        prompt=context + continuation,
        echo=True,
        max_tokens=0,
        temperature=0.0,
        logprobs=1,
    )
    token_logprobs = completion.choices[0].logprobs.token_logprobs
    loglikelihood = sum(token_logprobs[context_num_tokens:])
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
    client = OpenAI(base_url=api_base_url)

    correct_loglikelihood = get_loglikelihood(client, question, correct_answer, model)

    incorrect_loglikelihoods = [
        get_loglikelihood(client, question, incorrect_answer, model)
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
Correct loglikelihood: -5.820445537567139
Incorrect loglikelihoods: [-12.03919506072998, -13.01575756072998, -15.39857006072998]
Answer correctly: True
Score: 0.997196824939692
==============================================
Question: Where is Argonne National Laboratory located?
Correct answer: Lemont, Illinois
Incorrect answers: ['New York, New York', 'Los Angeles, California', 'Champaign, Illinois']
Correct loglikelihood: -21.478347714582924
Incorrect loglikelihoods: [-23.230124585330486, -20.380263715982437, -18.945664616767317]
Answer correctly: False
Score: 0.05966902318211982
==============================================
Question: What is machine learning?
Correct answer: Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.
Incorrect answers: ['Machine learning is a machine that can learn how to do anything.', 'Machine learning is a subset of mechanical engineering.']
Correct loglikelihood: -20.41767909093346
Incorrect loglikelihoods: [-38.0242698478105, -28.61479689974908]
Answer correctly: True
Score: 0.9997246069750586
==============================================
"""