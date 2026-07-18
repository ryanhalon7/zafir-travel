import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-burgundy text-ivory shadow-soft hover:bg-wine hover:shadow-luxe",
        secondary:
          "bg-sand text-burgundy shadow-soft hover:bg-muted-gold/25",
        outline:
          "border border-burgundy/20 bg-ivory/70 text-burgundy hover:bg-sand",
        ghost: "text-burgundy hover:bg-sand/70",
        link: "h-auto rounded-none p-0 text-burgundy underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export { buttonVariants };
