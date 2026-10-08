# Configuração de Proxy WSL2 (Debian) — Rede Corporativa

## Contexto

O WSL2 roda em uma sub-rede NAT isolada (`172.27.x.x`), separada da rede corporativa.
O proxy corporativo (`10.0.x.x:3128`) não é acessível diretamente pelo WSL2.
A solução é criar um **port forward** no Windows que faz a ponte entre o WSL2 e o proxy.

---

## Arquitetura

```
WSL2 (172.27.203.x)
    └─→ Gateway Windows (172.27.192.1:3128)
            └─→ Port Forward (netsh)
                    └─→ Proxy Corporativo (10.0.x.x:3128)
```

---

## Passo a Passo de Reconfiguração

### 1. Descobrir o IP atual do proxy corporativo (Windows)

```powershell
netsh winhttp show proxy
```

Anote o IP exibido em **Servidor(es) Proxy**, ex: `10.0.231.90:3128`

---

### 2. Verificar o gateway do WSL2 (Windows)

O gateway normalmente é fixo em `172.27.192.1`, mas para confirmar:

```powershell
wsl -d Debian -- ip route show default
```

O IP após `default via` é o gateway, ex: `172.27.192.1`

---

### 3. Recriar o Port Forward (PowerShell como Administrador)

Primeiro remove entradas antigas:

```powershell
netsh interface portproxy show all
# Para cada entrada com porta 3128, remova:
netsh interface portproxy delete v4tov4 listenport=3128 listenaddress=<ENDEREÇO>
```

Cria o novo port forward:

```powershell
netsh interface portproxy add v4tov4 `
  listenport=3128 `
  listenaddress=172.27.192.1 `
  connectport=3128 `
  connectaddress=<IP_PROXY_CORPORATIVO>
```

Confirma:

```powershell
netsh interface portproxy show all
```

---

### 4. Atualizar o proxy no WSL2 (root)

```bash
cat > /etc/apt/apt.conf.d/95proxies << 'EOF'
Acquire::http::proxy "http://172.27.192.1:3128/";
Acquire::https::proxy "http://172.27.192.1:3128/";
Acquire::ftp::proxy "http://172.27.192.1:3128/";
EOF
```

---

### 5. Testar

```bash
apt-get update
```

---

## Diagnóstico Rápido

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Could not connect to 10.0.x.x:3128` | `95proxies` aponta direto pro proxy | Refazer passo 4 |
| `Unable to connect to 172.27.x.x:3128` | Port forward ausente ou gateway mudou | Refazer passo 3 |
| Porta fechada no `/dev/tcp` | Firewall bloqueando ou port forward errado | Refazer passo 3 |
| IP do proxy mudou | Proxy corporativo rotacionou | Refazer passos 3 e 4 |

---

## Comandos Úteis

```bash
# Ver IP e gateway do WSL2
ip addr
ip route | grep default

# Verificar config atual do apt
cat /etc/apt/apt.conf.d/95proxies

# Testar porta manualmente
(echo >/dev/tcp/172.27.192.1/3128) 2>&1 && echo "ABERTA" || echo "FECHADA"
```

```powershell
# Ver proxy do Windows
netsh winhttp show proxy

# Ver port forwards ativos
netsh interface portproxy show all
```

---

## Observações

- O **IP do proxy corporativo** (`10.0.x.x`) pode mudar. Sempre verifique com `netsh winhttp show proxy`.
- O **gateway do WSL2** (`172.27.192.1`) é normalmente fixo.
- O **IP do WSL2** (`172.27.203.x`) muda a cada reinicialização, mas não impacta esta solução.
- O port forward é perdido ao reiniciar o Windows — precisará recriar (passo 3).
