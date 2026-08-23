export type AvatarColor =
  | "default"
  | "error"
  | "info"
  | "primary"
  | "success"
  | "warning";

const COLOR_GROUPS: Record<Exclude<AvatarColor, "default">, string> = {
  error: "VWX MZ",
  info: "FGTIJ123",
  primary: "ANHLQ98",
  success: "KDYBO45",
  warning: "PERSCU67",
};

const getFirstCharacter = (name: string): string =>
  name.trim().charAt(0).toUpperCase();

const getAvatarColor = (name: string): AvatarColor => {
  const firstCharacter = getFirstCharacter(name);
  const match = Object.entries(COLOR_GROUPS).find(([, characters]) =>
    characters.includes(firstCharacter),
  );

  return (match?.[0] as AvatarColor | undefined) ?? "default";
};

export default function createAvatar(name: string) {
  return {
    color: getAvatarColor(name),
    name: getFirstCharacter(name),
  };
}

