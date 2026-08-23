export const pxToRem = (value: number): string => `${value / 16}rem`;

type ResponsiveFontSizes = {
  sm: number;
  md: number;
  lg: number;
};

export const responsiveFontSizes = ({
  sm,
  md,
  lg,
}: ResponsiveFontSizes): Record<string, { fontSize: string }> => ({
  "@media (min-width:1200px)": { fontSize: pxToRem(lg) },
  "@media (min-width:600px)": { fontSize: pxToRem(sm) },
  "@media (min-width:900px)": { fontSize: pxToRem(md) },
});

