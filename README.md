# AuroraGPT Questions UI

A form to author questions for LLMs for evaluation

# Development: 

```
#use spack install npm and pip, and a few other dependencies
spack env activate .
spack install

# install frontend dependencies
cd frontend/
npm install

# alternatively "npm run builddev" for a development build
npm run build

#install backend dependencies
cd ../backend
pip install -r ./requirements.txt

# run the backend that hosts the frontend
unicorn --reload backend:app
```

# Deployment

To administer the site deployment, you'll need a CELS account and to be part of the group
`AuroraGPTQuestions` contact @robertu94 to be added.

There is a mailing list `agptquestionsform@cels.lists.anl.gov` for support for
external users.  Contact @robertu94 to be added to this.

There is a slack channel `#agpt-questions-form` to discuss development on the
CELS slack, if you are member of CELS, you should be able to join it freely
otherwise request access from CELS support at `help@cles.anl.gov`.

For the question testing function to be work, the persistence inference must be
running.  For support for the persistent inference server ask in
`#agpt-deployment-inference-runtime-apis` in the CELS slack which is
responsible for managing it.

To access the site, you'll need to [ssh to the CELS GCE environment](https://help.cels.anl.gov/docs/linux/ssh/).

From there you can `ssh $USER@agpt-questions-vmw-01` to access the VM. The app itself is deployed in `/app`

The deployment is administered using a service account `agpt` without privileges.

You also have privileges to:

+ do anything as the service user `sudo -u agpt /bin/bash`
+ restart the server `sudo systemctl restart questionsui.service`
+ check the logs `sudo journalctl -u questionsui.service`
+ edit the systemd service file `sudoedit /etc/systemd/system/questionsui.service` for this sevice
+ edit any files in `/app`

All other requests need to go through CELS support `help@cels.anl.gov`.

