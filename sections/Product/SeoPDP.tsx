import Seo from "apps/website/components/Seo.tsx";
import { ProductDetailsPage } from "apps/commerce/types.ts";
import { canonicalFromBreadcrumblist } from "apps/commerce/utils/canonical.ts";

export interface Props {
  /** @title Data Source */
  jsonLD: ProductDetailsPage | null;
  /**
   * @title Disable indexing
   * @description Prevents search engines from indexing this page
   */
  noIndexing?: boolean;
}

// deno-lint-ignore no-explicit-any
function sanitizeForJsonLD(page: ProductDetailsPage): ProductDetailsPage {
  const { product } = page;
  const rawOffers = product.offers;

  const cleanOffers = rawOffers
    ? {
      ...rawOffers,
      offers: (rawOffers.offers ?? [])
        .filter((o) => o.price !== undefined && o.price !== null)
        .map((o) => ({
          ...o,
          priceCurrency: o.priceCurrency || rawOffers.priceCurrency,
          priceSpecification: o.priceSpecification?.filter(
            (s) => s.price !== undefined && s.price !== null,
          ),
        })),
    }
    : undefined;

  // deno-lint-ignore no-explicit-any
  const cleanProduct: any = {
    ...product,
    description: product.description ||
      product.isVariantOf?.description ||
      undefined,
    offers: cleanOffers,
    isSimilarTo: undefined,
    isRelatedTo: undefined,
    isAccessoryOrSparePartFor: undefined,
    isVariantOf: product.isVariantOf
      ? { ...product.isVariantOf, hasVariant: [] }
      : undefined,
  };

  return { ...page, product: cleanProduct };
}

export function loader({ jsonLD, noIndexing }: Props, _req: Request) {
  if (!jsonLD) {
    return { noIndexing: true, jsonLDs: [] as unknown[] };
  }

  const clean = sanitizeForJsonLD(jsonLD);
  const { product, breadcrumbList, seo } = clean;

  return {
    title: seo?.title || product.name || "",
    description: seo?.description ||
      product.description ||
      product.isVariantOf?.description ||
      "",
    image: product.image?.[0]?.url,
    canonical: seo?.canonical ||
      canonicalFromBreadcrumblist(breadcrumbList) ||
      undefined,
    noIndexing: noIndexing || seo?.noIndexing || false,
    jsonLDs: [clean] as unknown[],
  };
}

function Section(props: ReturnType<typeof loader>) {
  return <Seo {...props} />;
}

export default Section;
