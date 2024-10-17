BACKEND_READY = True # Set to True when the LLM API is ready for requests.
LLM_API_BASE_URL = "https://data-portal-dev.cels.anl.gov/resource_server/sophia/vllm/v1/" # Replace it.
MODEL_NAME_MAP = {
    "Llama2-7B": "meta-llama/Llama-2-7b-hf",
    "Mistral-7B": "mistralai/Mistral-7B-v0.1",
    "Qwen2.5-7B": "Qwen/Qwen2.5-7B-Instruct",
    "Qwen2.5-14B": "Qwen/Qwen2.5-14B-Instruct",
    "Llama3-8B": "meta-llama/Meta-Llama-3-8B-Instruct",
    "Llama3-70B": "meta-llama/Meta-Llama-3-70B-Instruct",
}
