# Test Question Answer Pairs

:bulb: At the end, we need to talk to a permanent vllm server started on SWING (maybe), but for easy local testing, we show the processes to launch a vllm server on Polaris ourselves for quick testing. 

## Table of contents
* [Create a vllm server on Polaris](#create-your-own-vllm-server-on-polaris)
* [Test Question Answer Pairs](#test-question-answers-pairs)

## Create your own vllm server on Polaris

### Environment Setup

:bulb: I have a working conda env at `/eagle/tpc/zilinghan/conda_envs/vllm-rep`, you can simply reuse it by `conda activate /eagle/tpc/zilinghan/conda_envs/vllm-rep` you can access it.

Note that you need to install vllm in an interactive session with CUDA available. You can allocate an interactive job via `qsub -I -A <project> -q debug -l select=1 -l walltime=01:00:00 -l filesystems=home:grand:eagle`. 

```bash
# Create a conda environment
module load conda
module load gcc/11.2.0
module load cudatoolkit-standalone/11.8.0
conda create -p <path_to_conda_env> python=3.9 --y # change <path_to_conda_env>
conda activate <path_to_conda_env> # change <path_to_conda_env>
```

We need to first install the vllm from source for running the inference service. 

* First, clone the repository and remove the `pyproject.toml` file.
```bash
# Install vllm 0.4.1.post1
git clone https://github.com/vllm-project/vllm.git
cd vllm
git checkout e46a60aa4c90cf3dfd9b90782f2eeabbda935eef # [Optional] Only for better reproducibility
rm pyproject.toml
```

* Then, open `setup.py` and set cuda version to 11.8 by changing 
```python
MAIN_CUDA_VERSION = "12.1" ==> MAIN_CUDA_VERSION = "11.8"
```

* Install xformers for cuda 11.8
```bash
pip install xformers==0.0.23 --index-url https://download.pytorch.org/whl/cu118
```

* Open `requirements-cuda.txt` and remove two lines containing `torch` and `xformers`. 

* Start installation. 
```bash
pip install packaging
pip install -e . # !You need to install vllm in an interactive session with CUDA available
pip install flash-attn --no-build-isolation
pip uninstall filelock
conda install conda-forge::filelock
conda install conda-forge::openai
```

* Clone this repo somewhere you like.
```bash
git clone git@github.com:auroraGPT-ANL/questions-ui.git
```

### Serving model on a single node
* Submit interactive job using `qsub -I -A <project> -q debug -l select=1 -l walltime=01:00:00 -l filesystems=home:grand:eagle` and run the vllm api server as shown below on a compute node.

```bash
qsub -I -A <project> -q debug -l select=1 -l walltime=01:00:00 -l filesystems=home:grand:eagle
module load conda
cd <path_to_this_repo>
conda activate <path_to_conda_env> # change <path_to_conda_env> to the one created
export HF_TOKEN=<your_hf_write_token>
export RAY_TMPDIR='/tmp'
export OPENBLAS_NUM_THREADS=16
CUDA_VISIBLE_DEVICES=0,1,2,3 python3 -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-2-7b-hf --tokenizer=meta-llama/Llama-2-7b-hf  --download-dir=<your_cache_dir> --host 0.0.0.0 --tensor-parallel-size 4 # change <your_cache_dir>
```

:bulb: **Note:** To use `meta-llama/Llama-2-7b-hf `, you need to first get access it on HuggingFace and generate a write access token [here](https://huggingface.co/settings/tokens) and replace <your_hf_write_token> with it. 

:bulb: **Note:** It is recommended to create a cache directory to store models used by the server, such as `/eagle/tpc/<your_name>/.cache`.

:bulb: **Note:** After launching the vllm server, you should be able to something similar to below.
```bash
INFO:     Started server process [21203]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
...
```

## Test Question Answers Pairs

Go to another **login** node of Polaris and run the [tunnel.sh](./inference_server/tunnel.sh) to establish a ssh tunnel to the allocated node running the inference server, and set proxy.

```bash
module load conda
conda activate <path_to_conda_env> # change <path_to_conda_env>
cd <path_to_this_repo>
bash inference_server/tunnel.sh # establish ssh tunnel
source inference_server/set_proxy.sh # set proxy
```

Then you can test few question answer pairs by running:

```bash
python test_questions.py
```
