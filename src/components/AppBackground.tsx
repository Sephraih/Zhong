import { useIsMobile } from "../hooks/useIsMobile";

// Background images (expected in src/assets/):
//  - landscape.(jpg|jpeg|png|webp)  (desktop)
//  - portrait.(jpg|jpeg|png|webp)   (mobile)
const desktopBgExact = import.meta.glob("../assets/landscape.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const mobileBgExact = import.meta.glob("../assets/portrait.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const DESKTOP_BG_ASSET = Object.values(desktopBgExact)[0] ?? null;
const MOBILE_BG_ASSET = Object.values(mobileBgExact)[0] ?? null;

interface AppBackgroundProps {
  /** Whether to show a stronger overlay for better text contrast */
  darken?: boolean;
}

export function AppBackground({ darken = false }: AppBackgroundProps) {
  const isMobile = useIsMobile();
  const bgUrl = isMobile ? MOBILE_BG_ASSET : DESKTOP_BG_ASSET;

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {/* Image layer */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{
            objectPosition: isMobile ? "50% 15%" : "50% 50%",
            opacity: darken ? 0.5 : 0.7,
            filter: "saturate(1.05) contrast(1.05)",
          }}
          draggable={false}
        />
      )}

      {/* Gradient overlay for readability */}
      <div 
        className={`absolute inset-0 ${
          darken 
            ? "bg-gradient-to-b from-black/60 via-black/75 to-black/90" 
            : "bg-gradient-to-b from-black/30 via-black/60 to-black/85"
        }`} 
      />
    </div>
  );
}
