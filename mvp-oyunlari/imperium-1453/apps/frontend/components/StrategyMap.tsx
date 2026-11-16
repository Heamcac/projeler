"use client";

import type { Faction, Province, Terrain } from "@imperium/shared";

const factionColors: Record<string, string> = {
  ottomans: "#8f2f2f",
  byzantium: "#6f4aa8",
  venice: "#2f6f73",
  hungary: "#b84f3a",
  serbia: "#506b9f",
  wallachia: "#315443",
  mamluks: "#b08b32",
  karamanids: "#6f8e3a",
  genoa: "#9f405f",
  hospitallers: "#d8d2c4",
};

const terrainTexture: Record<Terrain, string> = {
  plains: "url(#plainsTexture)",
  hills: "url(#hillsTexture)",
  mountains: "url(#mountainTexture)",
  forest: "url(#forestTexture)",
  coastal: "url(#coastalTexture)",
  urban: "url(#urbanTexture)",
  desert: "url(#desertTexture)",
};

const seaRoutes = [
  "M515 245 C560 300 585 380 610 430 C645 455 672 478 690 500",
  "M430 355 C455 385 458 423 460 455 C510 455 565 445 610 430",
  "M515 245 C555 205 598 160 640 115",
  "M225 245 C310 265 385 300 430 355",
];

interface StrategyMapProps {
  provinces: Province[];
  selectedProvinceId?: string;
  factions: Faction[];
  onSelectProvince: (province: Province) => void;
}

export function StrategyMap({ provinces, selectedProvinceId, factions, onSelectProvince }: StrategyMapProps) {
  const factionById = new Map(factions.map((faction) => [faction.id, faction]));

  return (
    <svg viewBox="120 60 780 520" className="imperium-map h-full w-full" role="img" aria-label="Imperium 1453 eyalet haritasi">
      <defs>
        <linearGradient id="seaGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#8fb7bd" />
          <stop offset="52%" stopColor="#5e9298" />
          <stop offset="100%" stopColor="#356f78" />
        </linearGradient>
        <radialGradient id="selectedGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7c2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff7c2" stopOpacity="0" />
        </radialGradient>
        <pattern id="plainsTexture" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 12 C4 9 7 9 11 12 S18 15 22 12" stroke="#f2d79b" strokeOpacity="0.22" fill="none" />
        </pattern>
        <pattern id="hillsTexture" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M2 14 Q7 7 12 14 T22 14" stroke="#f4e4b6" strokeOpacity="0.25" fill="none" />
        </pattern>
        <pattern id="mountainTexture" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M2 16 L8 6 L14 16 M10 16 L15 9 L20 16" stroke="#f7f1df" strokeOpacity="0.28" fill="none" />
        </pattern>
        <pattern id="forestTexture" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="6" r="2" fill="#173c2e" opacity="0.18" />
          <circle cx="12" cy="12" r="2" fill="#173c2e" opacity="0.16" />
        </pattern>
        <pattern id="coastalTexture" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 8 C4 5 8 11 12 8 S18 5 22 8" stroke="#f8f3dc" strokeOpacity="0.22" fill="none" />
        </pattern>
        <pattern id="urbanTexture" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M2 2 H6 V6 H2 Z M8 8 H12 V12 H8 Z" fill="#f6e7bd" opacity="0.26" />
        </pattern>
        <pattern id="desertTexture" width="22" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 13 C5 10 9 10 14 13 S23 16 28 13" stroke="#fff1bf" strokeOpacity="0.2" fill="none" />
        </pattern>
      </defs>

      <rect x="120" y="60" width="780" height="520" fill="url(#seaGradient)" />
      <g className="map-current">
        <path d="M120 178 C222 128 318 116 420 148 C494 172 548 156 625 128 C716 95 813 96 900 132 L900 60 L120 60 Z" />
        <path d="M120 255 C192 225 262 212 342 238 C428 266 500 247 565 222 C640 194 742 197 900 232 L900 60 L120 60 Z" />
        <path d="M120 515 C238 470 355 468 462 496 C552 520 646 508 760 462 C815 440 862 436 900 446 L900 580 L120 580 Z" />
      </g>
      <g className="map-land">
        <path d="M155 92 C240 78 315 93 382 132 C440 166 493 167 552 143 C640 105 748 103 872 132 L900 63 L120 60 Z" />
        <path d="M208 155 C295 128 377 147 459 188 C527 222 590 214 662 183 C735 151 805 153 887 188 L884 258 C772 235 705 229 626 259 C558 284 491 293 415 262 C330 227 247 221 164 252 Z" />
        <path d="M532 265 C614 250 684 278 746 330 C817 389 843 456 829 545 L608 545 C598 492 572 444 531 403 C492 363 482 311 532 265 Z" />
        <path d="M128 430 C244 390 347 398 446 430 C535 459 624 451 724 411 C790 385 849 383 900 400 L900 580 L120 580 Z" />
      </g>

      <g className="map-grid" aria-hidden="true">
        {[180, 260, 340, 420, 500].map((y) => (
          <path key={`lat-${y}`} d={`M120 ${y} C320 ${y - 20} 700 ${y + 20} 900 ${y}`} />
        ))}
        {[220, 340, 460, 580, 700, 820].map((x) => (
          <path key={`lon-${x}`} d={`M${x} 60 C${x - 25} 220 ${x + 25} 400 ${x} 580`} />
        ))}
      </g>

      <g className="sea-routes" aria-hidden="true">
        {seaRoutes.map((route, index) => (
          <path key={route} d={route} style={{ animationDelay: `${index * 0.7}s` }} />
        ))}
      </g>

      <g className="province-layer">
        {provinces.map((province) => {
          const isSelected = province.id === selectedProvinceId;
          const fill = factionColors[province.controllerFactionId] ?? "#8c8c7d";
          const label = factionById.get(province.controllerFactionId)?.name ?? province.controllerFactionId;
          const points = makeProvincePolygon(province);

          return (
            <g key={province.id} className={isSelected ? "province selected" : "province"}>
              {isSelected ? <circle cx={province.x} cy={province.y} r="52" fill="url(#selectedGlow)" className="selection-glow" /> : null}
              <polygon
                points={points}
                fill={fill}
                stroke={isSelected ? "#111827" : "#f4ead4"}
                strokeWidth={isSelected ? 3 : 1.35}
                onClick={() => onSelectProvince(province)}
              >
                <title>{`${province.name} - ${label}`}</title>
              </polygon>
              <polygon points={points} fill={terrainTexture[province.terrain]} pointerEvents="none" />
              {province.id === "constantinople" ? (
                <circle cx={province.x} cy={province.y} r="19" className="siege-pulse" pointerEvents="none" />
              ) : null}
              <text x={province.x} y={province.y + 4} textAnchor="middle" fontSize="10" fill="#fffaf0" pointerEvents="none">
                {province.name.length > 10 ? province.name.slice(0, 9) : province.name}
              </text>
            </g>
          );
        })}
      </g>

      <g className="map-labels" aria-hidden="true">
        <text x="455" y="470">Ege Denizi</text>
        <text x="640" y="225">Karadeniz</text>
        <text x="675" y="468">Doğu Akdeniz</text>
        <text x="318" y="178">Balkanlar</text>
        <text x="654" y="342">Anadolu</text>
      </g>
    </svg>
  );
}

function makeProvincePolygon(province: Province) {
  const radius = province.terrain === "urban" ? 25 : province.terrain === "mountains" ? 34 : 31;
  const seed = Array.from(province.id).reduce((total, char) => total + char.charCodeAt(0), 0);

  return Array.from({ length: 7 })
    .map((_, index) => {
      const angle = (Math.PI * 2 * index) / 7 - Math.PI / 2;
      const wobble = 0.84 + (((seed + index * 17) % 23) / 100);
      const x = Math.round(province.x + radius * wobble * Math.cos(angle));
      const y = Math.round(province.y + radius * wobble * Math.sin(angle));
      return `${x},${y}`;
    })
    .join(" ");
}
