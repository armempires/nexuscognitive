# Pagamentos Asaas via Supabase

O fluxo de pagamento usa apenas o Supabase como banco. As Edge Functions usam a `service_role` internamente; o navegador conhece somente a URL do projeto e a chave anon.

## Secrets

Configure no projeto Supabase:

```sh
supabase secrets set ASAAS_API_KEY=... ASAAS_ENVIRONMENT=sandbox ASAAS_WEBHOOK_TOKEN=...
supabase secrets set APP_ORIGIN=https://seu-dominio.com
```

Use `ASAAS_ENVIRONMENT=production` somente depois de validar no sandbox. O sandbox usa `https://api-sandbox.asaas.com/v3`; produção usa `https://api.asaas.com/v3`. O webhook do Asaas deve apontar para `/functions/v1/asaas-webhook` e enviar o mesmo token configurado em `ASAAS_WEBHOOK_TOKEN`.

## Deploy

```sh
supabase db push
supabase functions deploy create-payment
supabase functions deploy payment-status
supabase functions deploy asaas-webhook
```

Nunca coloque `ASAAS_API_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` em `client/.env`, no bundle Vite ou em código versionado.