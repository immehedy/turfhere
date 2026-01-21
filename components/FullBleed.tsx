import React from "react";

const FullBleed = ({ children }: { children: React.ReactNode }) => {
  return <div className="-mx-4 sm:mx-0">{children}</div>;
};

export default FullBleed;
