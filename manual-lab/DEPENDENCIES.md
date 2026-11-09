# Sabitler ve opsiyonel telemetry sözleşmesi

Default gerçek lab: minikube1.38.1, Kubernetes1.35.1, kicbase0.0.50 ve kindnet.
`doctor`, kurulu minikube help'inde keep-context/embed-certs/nodes/listen-address/cni
bayraklarını denetler; installer veya package manager çalıştırmaz.

Minikube1.38.1'in gerçek kaynak CNI seçicisi `false` değerini Disabled olarak
işler. Bu değer help'in kısa seçenek listesinde ayrıca gösterilmiyor; uydurulmuş
bir flag değildir. Opsiyonel ayrı lab'ın ilk bootstrap'ında yalnız API beklenir,
ardından açıkça pinned Cilium kurulup bütün Node'ların gerçek Ready olması beklenir:
[minikube1.38.1 CNI kaynağı](https://github.com/kubernetes/minikube/blob/v1.38.1/pkg/minikube/cni/cni.go).

Opsiyonel Cilium chart/app1.20.2 ve Hubble CLI1.20.2 sabittir.
[Resmi Chart.yaml](https://github.com/cilium/cilium/blob/v1.20.2/install/kubernetes/cilium/Chart.yaml)
chart sürümünü ve Kubernetes asgari sürüm koşulunu tanımlar; bu metadata tek başına
bu makinede uyum/gerçek trafik testi değildir. [Resmi Helm kurulum yöntemi](https://docs.cilium.io/en/stable/installation/k8s-install-helm/)
ve [aynı tag'in değerleri](https://github.com/cilium/cilium/blob/v1.20.2/install/kubernetes/cilium/values.yaml)
kullanılır. Sistem Helm config/registry/cache'i değiştirilmez; lab'a özel yollar seçilir.

Template'te agent↔relay mTLS açıktır. Relay'nin client-facing servisi yalnız owned
kubectl port-forward ile127.0.0.1'e açılır; backend'in explicit loopback plaintext
izni bu private lab bağlantısına uygulanır. ClusterMesh, yeni NetworkPolicy,
policy gevşetme, Hubble UI, L7 redirect/policy veya metrics collector kurulmaz.
Gerçek L4 flow sayısı HTTP istek/byte/bant genişliği ölçümü diye raporlanmaz.

Telemetry kurulumu/restart/provider E2E ayrı lease ve gerçek kanıt gerektirir.
Template veya başarılı Helm render, çalıştırılmış kurulum sayılmaz.
