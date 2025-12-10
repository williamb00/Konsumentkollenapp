import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "activate-subscription":
      return {
        status: "active",
        message: "Konsumentkollen har aktiverats för din butik.",
      };
    case "deactivate-subscription":
      return {
        status: "inactive",
        message: "Konsumentkollen har stängts av.",
      };
    default:
      return { status: "idle" };
  }
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const isSubmitting =
    fetcher.state === "submitting" || fetcher.state === "loading";

  const currentStatus = fetcher.data?.status ?? "inactive";
  const isActive = currentStatus === "active";

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    }
  }, [fetcher.data?.message, shopify]);

  const activate = () => {
    fetcher.submit(
      { intent: "activate-subscription" },
      { method: "POST" },
    );
  };

  const deactivate = () => {
    fetcher.submit(
      { intent: "deactivate-subscription" },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="Konsumentkollen från ViPo Säkerhetstjänster">
      <s-button
        slot="primary-action"
        onClick={isActive ? deactivate : activate}
        {...(isSubmitting ? { loading: true } : {})}
      >
        {isActive ? "Stäng av Konsumentkollen" : "Aktivera Konsumentkollen"}
      </s-button>

      {/* Huvudkort: produktbeskrivning och CTA */}
      <s-section>
        <s-stack direction="block" gap="base">
          <s-heading>Konsumentkollen för din webbutik</s-heading>

          <s-paragraph>
            Gör det enkelt för dina kunder att förstå sina rättigheter direkt
            i köpupplevelsen. Konsumentkollen visar tydlig information om
            ångerrätt, öppet köp och garanti i dina viktigaste flöden.
          </s-paragraph>

          <s-stack direction="inline" gap="base">
            <s-heading>89 kr / månad</s-heading>
            <s-badge tone="success">Ingen bindningstid</s-badge>
          </s-stack>

          <s-unordered-list>
            <s-list-item>
              Färre onödiga reklamationer och missförstånd efter köp.
            </s-list-item>
            <s-list-item>Mindre tryck på kundtjänst.</s-list-item>
            <s-list-item>
              Ökad trygghet för kunden – tydligt vad som gäller innan köp.
            </s-list-item>
          </s-unordered-list>

          <s-stack direction="inline" gap="base">
            <s-button
              variant="primary"
              onClick={isActive ? deactivate : activate}
              {...(isSubmitting ? { loading: true } : {})}
            >
              {isActive ? "Stäng av för butiken" : "Aktivera för butiken"}
            </s-button>

            <s-paragraph>
              <s-text>
                Vill du läsa mer?{" "}
                <s-link href="https://vipo.se" target="_blank">
                  Besök vipo.se
                </s-link>
              </s-text>
            </s-paragraph>
          </s-stack>
        </s-stack>
      </s-section>

      {/* Kort: Var visas Konsumentkollen? */}
      <s-section heading="Var visas Konsumentkollen?">
        <s-paragraph>
          När du aktiverar tjänsten kan Konsumentkollen visas på flera
          nyckelplatser i butiken. I kommande versioner kan du slå av/på
          respektive yta och finjustera texterna.
        </s-paragraph>

        <s-stack direction="block" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>Kundvagn</s-heading>
            <s-paragraph>
              Kunden ser sina rättigheter precis innan de går vidare till
              kassan.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>Produktsida</s-heading>
            <s-paragraph>
              Tydlig information per produkt – extra viktigt för dyrare eller
              mer komplexa varor.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>Checkout</s-heading>
            <s-paragraph>
              Sammanfattning av de viktigaste rättigheterna precis innan
              betalning.
            </s-paragraph>
          </s-box>
        </s-stack>
      </s-section>

      {/* Kort: Testköp */}
      <s-section heading="Testa upplevelsen">
        <s-paragraph>
          När Konsumentkollen är aktiv kan du göra ett testköp i butiken för
          att se exakt hur dina kunder upplever informationen.
        </s-paragraph>

        <s-paragraph>
          <s-link href="/" target="_blank">
            Öppna butiken i en ny flik
          </s-link>
        </s-paragraph>
      </s-section>

      {/* Högerspalt: statuskort */}
      <s-section slot="aside" heading="Status för Konsumentkollen">
        <s-stack direction="block" gap="base">
          <s-badge tone={isActive ? "success" : "critical"}>
            {isActive ? "Aktiv" : "Inte aktiv"}
          </s-badge>

          <s-paragraph>
            När tjänsten är aktiv debiteras{" "}
            <s-text emphasis>89 kr / månad</s-text> via din Shopify-faktura.
            Ingen bindningstid.
          </s-paragraph>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>Nästa steg</s-heading>
            <s-unordered-list>
              <s-list-item>Aktivera tjänsten för din butik.</s-list-item>
              <s-list-item>Gör ett testköp och se widgeten i kassan.</s-list-item>
              <s-list-item>
                Justera placeringar och texter när konfig‑sidan är på plats.
              </s-list-item>
            </s-unordered-list>
          </s-box>
        </s-stack>
      </s-section>

      {/* Högerspalt: supportkort */}
      <s-section slot="aside" heading="Support & kontakt">
        <s-paragraph>
          Har du frågor om Konsumentkollen eller vill diskutera större volymer?
          Hör av dig till ViPo så hjälper vi dig vidare.
        </s-paragraph>

        <s-unordered-list>
          <s-list-item>E‑post: support@vipo.se</s-list-item>
          <s-list-item>Telefon: 010‑000 00 00</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
