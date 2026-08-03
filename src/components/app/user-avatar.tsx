import Image from "next/image";

type UserAvatarProps = {
  alt: string;
  avatarUrl: string | null;
  initial: string;
  size?: number;
};

export function UserAvatar({
  alt,
  avatarUrl,
  initial,
  size = 40,
}: UserAvatarProps) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-app-border bg-app-surface text-xs font-semibold text-app-text"
      style={{
        height: size,
        width: size,
      }}
    >
      {avatarUrl ? (
        <Image
          alt={alt}
          className="object-cover"
          fill
          sizes={`${size}px`}
          src={avatarUrl}
        />
      ) : (
        initial
      )}
    </span>
  );
}