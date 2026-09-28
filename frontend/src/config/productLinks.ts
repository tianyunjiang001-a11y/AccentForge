interface ProductLinks {
  contact: string | null;
  github: string | null;
}

// Supply verified public links here before production deployment.
export const PRODUCT_LINKS: ProductLinks = {
  contact: null,
  github: null,
};
