# Workflow

## Talep Yaşam Döngüsü

- `PENDING`
- `IN_REVIEW`
- `INFO_REQUIRED`
- `APPROVED`
- `REJECTED`
- `IMPLEMENTATION_PENDING`
- `COMPLETED`
- `CANCELLED`

MVP'de ekip lideri onayı sonrası talep doğrudan `IMPLEMENTATION_PENDING` durumuna geçer. Veritabanındaki `approval_steps` modeli birden fazla onay aşamasına genişletmeye hazırdır.

Ret ve ek bilgi taleplerinde gerekçe zorunludur.

Fatura yetkilisinin `complete` işlemi HBYS'deki manuel işlemin HOSPİON'a kaydedilmesidir; uygulama HBYS üzerinde otomatik iptal yaptığını iddia etmez.
