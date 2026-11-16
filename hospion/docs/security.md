# Güvenlik ve Üretim Eksikleri

Bu MVP geliştirme ortamı içindir.

Uygulananlar:

- HttpOnly oturum cookie'si
- CSRF koruması
- Argon2id parola hashleme
- Backend RBAC
- Birim ve kaynak bazlı erişim kontrolü
- Parametreli SQL sorguları
- Audit log ve request event kayıtları
- Satır kilidi ve optimistic `version` kontrolüyle karar çakışması azaltma

Üretim öncesi gerekli adımlar:

- HTTPS, HSTS ve güvenli proxy başlıkları
- Gerçek session store, örneğin Redis veya PostgreSQL
- Kurumsal SSO değerlendirmesi
- Rate limit için dağıtık store
- Güvenlik testi, SAST/DAST ve penetrasyon testi
- Loglarda gerçek hasta verisi maskeleme politikası
- KVKK veri işleme, saklama ve erişim prosedürleri
- Demo hesaplarının kaldırılması
- HBYS entegrasyonu için kurum onaylı arayüz ve test protokolü
