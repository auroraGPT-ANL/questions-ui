# Kubernetes manifests for the application

Do not deploy with Kubernetes unless you have experience using kubernetes

## Footguns/Things to know

1. By default, the `StorageClass` on distributions like k3s default to `persistentVolumeReclaimPolicy` `Delete` which will delete the experiment files when you delete the application which is likely not what you want
2. You'll likely need to configure ImagePullSecrets to pull the image since it is private by default.  See `imagepull.sh` for details
3. While this application configures Ingress, you'll likely need to configure an ExternalDNS entry to that its routable with a domain name you expect.
4. Depending on your site, you'll want to modify the template to change the storage allocation, storage class, and ingress configurations as appropriate
