import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  multiple?: boolean;
  accept?: string;
  files?: File[];
  onChange?: (files: File[]) => void;
  // test ids
  buttonTestId?: string;
  containerTestId?: string;
  fileItemTestIdPrefix?: string;
};

const FileInput: React.FC<Props> = ({
  label,
  multiple = false,
  accept = "image/*",
  files = [],
  onChange,
  buttonTestId,
  containerTestId,
  fileItemTestIdPrefix,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleChoose = () => inputRef.current?.click();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    onChange?.(list);
  };

  return (
    <div data-testid={containerTestId}>
      {label && <div className="mb-2 text-sm font-medium">{label}</div>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={onFiles}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={handleChoose}
          data-testid={buttonTestId}
        >
          Adauga {multiple ? "poze" : "poze"}
        </Button>
        <div className="flex gap-2 items-center">
          {files && files.length > 0 ? (
            files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                data-testid={
                  fileItemTestIdPrefix
                    ? `${fileItemTestIdPrefix}-${i}`
                    : undefined
                }
              >
                {f.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-10 w-10 rounded object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded border flex items-center justify-center text-xs p-1">
                    {f.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm truncate max-w-[12rem]">{f.name}</span>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Nici o imagine adaugata
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export { FileInput };
