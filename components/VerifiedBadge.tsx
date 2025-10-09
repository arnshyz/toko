export type VerifiedBadgeProps = {
  className?: string;
  size?: number;
  title?: string;
};

const BADGE_SRC = "https://p-store.net/_ipx/_/images/logo-verifikasi.png";

export function VerifiedBadge({ className, size = 16, title = "Terverifikasi" }: VerifiedBadgeProps) {
  const classes = ["inline-block align-middle"]; // keep badge aligned with text
  if (className) {
    classes.push(className);
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BADGE_SRC}
      alt={title}
      title={title}
      width={size}
      height={size}
      className={classes.join(" ")}
    />
  );
}
