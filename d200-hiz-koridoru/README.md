# D-200 hız koridoru paneli

ZIP içindeki kaynak dosyalarla oluşturulmuş çalışır React uygulaması.

## Çalıştırma

Node.js 20 veya üstü gerekir. Proje klasöründe:

```sh
npm install
npm run dev
```

Terminalde gösterilen yerel adresi tarayıcıda açın. Üretim derlemesi için `npm run build` çalıştırın.

Simülatör sayfa açıldığında kullanılabilir. Gerçek GPS tarayıcı izni ister ve genellikle yalnızca `localhost` veya HTTPS üzerinden çalışır.

Harita [Leaflet](https://leafletjs.com/) ile çalışır ve [OpenStreetMap](https://www.openstreetmap.org/copyright) harita döşemelerini kullanır. Harita döşemeleri için internet bağlantısı gerekir. Mavi çizgi yaklaşık güzergâhı, sarı çizgiler örnek koridorları, yeşil işaretçi simülasyon/GPS konumunu gösterir. **Rotayı göster** ve **Konumu takip et** düğmeleri harita görünümünü kontrol eder. Herkese açık bir dağıtımda [OSM döşeme kullanım politikasını](https://operations.osmfoundation.org/policies/tiles/) dikkate alın.

## Karayolu rotası

Rota, açılışta OpenStreetMap yol verisiyle çalışan bir yönlendirme servisinden (varsayılan: OSRM demo sunucusu) istenir ve **Bursa → Kestel → Turanköy → Ümitalan → İnegöl → Bozüyük → Sivrihisar → Polatlı → Ankara** ara noktalarından geçirilir. Sonuç tarayıcıda saklanır; sonraki açılışlarda internet isteği yapılmaz. Simülatör, segmentler ve PTS koridorları da bu yol çizgisine oturtulur.

- Ara noktalar `src/data/d200CorridorData.ts` içindeki `D200_ROUTING_WAYPOINTS` listesindedir. Turanköy konumu yaklaşıktır; rota yan bir yola sapıyorsa bu koordinatı D-200 üzerindeki bir noktayla değiştirin.
- Haritanın üstündeki ✓ / ✗ listesi rotanın Kestel, Turanköy ve Ümitalan'a en fazla 2 km yaklaştığını doğrular.
- Servise ulaşılamazsa kesikli mavi çizgiyle kaba rota gösterilir; **Yeniden dene** düğmesi yeniden ister.
- OSRM demo sunucusu üretim için uygun değildir. Kendi sunucunuzu kurup `.env` dosyasında `VITE_ROUTING_BASE_URL` ile adresini verin (bkz. `.env.example`).

**Uyarı:** Güzergâh, koridor ve hız sınırı verileri örnektir. Sürüş kararlarında yol levhalarını ve resmi talimatları esas alın.
