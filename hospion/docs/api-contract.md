# API Contract

Prefix: `/api/v1`

Yanıt formatı:

```json
{ "ok": true, "data": {} }
```

## Auth

- `GET /auth/csrf`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Departments

- `GET /departments`

## Request Types

- `GET /request-types`

## Requests

- `POST /requests`
- `GET /requests`
- `GET /requests/:id`
- `GET /requests/:id/events`
- `GET /request-logs?requestId=&eventType=&search=&from=&to=&page=1&pageSize=20`
- `POST /requests/:id/cancel`
- `POST /requests/:id/decision`

Log sorgusu her oturum rolüne açıktır ve talep okuma yetkisiyle sınırlandırılır. Personel kendi taleplerini, lider kendi birimi ve aktif lider olarak atandığı birimlerin taleplerini, yönetici/denetçi/fatura yetkilisi tüm talepleri görür. `requestId` açıkça istenirse yetkisiz talep için 403 döner. `from` dahil, `to` hariç ISO tarih filtresidir. Yanıt `items`, `total`, `page`, `pageSize` içerir. Log kayıtlarını değiştiren veya silen API bulunmaz.

Yeni olaylarda işlem anındaki kullanıcı adı/rolü, önceki/yeni durum, sürüm ve karar gerekçesi veya HBYS sonucu metadata içinde saklanır. Aynı bilgiler işlemle aynı transaction içinde `request_events` ve `audit_logs` tablolarına yazılır. Eski kayıtlar mevcut bilgilerle gösterilir; geçmişte saklanmamış durum bilgileri tahmin edilmez.

## Approvals

- `GET /approvals/inbox`

## Implementations

- `POST /requests/:id/complete`
- `POST /requests/:id/verify`

## Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`

## Reports

- `GET /reports/summary`

## Admin

- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/departments`
- `POST /admin/departments`
- `PATCH /admin/departments/:id`
- `POST /admin/department-leaders`
