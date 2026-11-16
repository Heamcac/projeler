# Dort fazli gelistirme plani

## Faz 1: MVP ticaret ve olcu tabanli yonlendirme

Mevcut paket auth, coklu vucut profili, kategorili katalog, varyant olculeri, olculmus kumas esnemesi, fit-check, %90+ bel/bacak feed'i, stok rezervasyonu, siparis snapshot'i ve beden uyumsuzlugu iade talebini calistirir.

Canliya cikis adimlari: urun/satici yonetimi ve gercek veri girisi; odeme ve para iadesi adapter'i; kargo, fatura ve komisyon mutabakati; PostgreSQL/Redis ortaminda entegrasyon ve yuk testleri; SKU bazinda gercek prova ile fit katsayilarinin kalibrasyonu; stok/odeme/rezervasyon surelerinin izlenmesi.

Kabul: stok yarisi asiri satis yaratmaz; fiyat/komisyon snapshot'i degismez; eksik olculer yanlis beden onerisini engeller; her urun kategorisi icin olcu toplama protokolu tanimlidir; kullaniciya gosterilen beden onerisi iade nedeniyle karsilastirilabilir.

## Faz 2: AI 2D sanal prova

Mevcut paket async is satiri, dispatcher, BullMQ/yerel worker, Redis cache, retry, imzali webhook, provider allowlist ve baz manken secimi sunar. Demo ciktisi sematiktir.

Adimlar: lisansli baz manken gorsel katalogu; farkli boy/cevre oranlari icin katalog kapsama olcumu; Replicate/Kling/ozel pipeline gateway'i; dekupe ve maske kalitesi kontrolu; sonuc obje deposu ve imzali URL; GPU/servis maliyeti, zaman asimi ve render kalitesi izlemesi; model surumu degisince cache yenilenmesi.

Kabul: saglayici ayni job UUID'si icin tekrar fatura/uretim yapmaz; duplicate ve gec callback sonucu bozmaz; cache kisi ve profil surumune gore ayridir; gorsel prova ile olcu tabanli fit iddialari urun arayuzunde dogru temsil edilir.

## Faz 3: Satici paneli ve Excel/OCR aktarimi

Mevcut paket magazaya ait varyant olculerinin sahiplik ve revision kontrollu guncelleme endpoint'ini sunar. OCR/Excel aktarimi bu pakette yoktur.

Adimlar: satici paneli; XLSX/CSV sablonlari; karantina obje deposu; dosya satir/hucre limitleri; OCR is kuyrugu; kategoriye gore olcu esleme; duz genislik/cevre ve inch/cm birim donusumu; onizleme ve satici onayi; checksum'li aktarim gecmisi; toplu upsert ve denetim kaydi.

Kabul: eksik bedenler ve karisik birimler isaretlenir; OCR verisi sessizce yayina alinmaz; ayni dosya iki kez islenmez; eszamanli duzenlemeler revision ile korunur; saticilar birbirlerinin varyantlarini degistiremez.

## Faz 4: Kisisel 3D avatar ve canli kumas

Mevcut paket cm -> metre katmanini ve GLB/glTF varlik referansini sunar. Hazir SMPL-X mesh'i veya fizik simulasyonu uretmez.

Adimlar: SMPL-X veya lisansli parametrik mesh; olcu fitting optimizasyonu ve morph kalibrasyonu; GLB export servisi; Three.js tam ekran interaktif istemci; dikis/parca topolojisi ve kumas materyal olcumleri; collision/cloth engine entegrasyonu; GPU sunucu bake ve istemci LOD; mobil kaynak butcesi; gercek giysi/prova ile geometri ve gerilim dogrulamasi.

Kabul: avatar hedef olculeri belirlenen hata sinirinda karsilar; olcu degisimi mesh'e tutarli yansir; giysi collision'i ve dikisler bozulmaz; telefonlarda sahne gorunur ve hareket eder; fizik katsayilari belgelenmis deneylerden gelir; AI gorsel skoru fiziksel uyum skoru olarak kullanilmaz.
