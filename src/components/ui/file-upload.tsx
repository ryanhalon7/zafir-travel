"use client";

import { Upload } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  buttonText?: string;
  emptyText?: string;
};

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      id,
      className,
      buttonText = "Choose file",
      emptyText = "No file selected",
      multiple,
      onChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [selection, setSelection] = React.useState(emptyText);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(event.target.files ?? []);

      if (files.length === 0) {
        setSelection(emptyText);
      } else if (files.length === 1) {
        setSelection(files[0].name);
      } else {
        setSelection(`${files.length} files selected`);
      }

      onChange?.(event);
    }

    return (
      <div className={cn("flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center", className)}>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="file"
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          aria-disabled={disabled}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-muted-gold peer-focus-visible:ring-offset-2",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {buttonText}
        </label>
        <span className="min-w-0 truncate text-sm text-espresso/55" title={selection}>
          {selection}
        </span>
      </div>
    );
  },
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
