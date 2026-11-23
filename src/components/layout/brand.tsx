import Image from "next/image";

export function Brand() {
  return (
    <>
      <Image src="/brand/scale-bae.svg" width={36} height={36} alt="" className="brand-mark" unoptimized />
      <span className="brand-name">scale-<i>bae</i></span>
    </>
  );
}
