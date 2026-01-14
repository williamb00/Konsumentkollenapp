import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * Vi sparar per SHOP (butik) så att varje partner får sin egen Scrive-länk.
 * Metafield:
 *  - owner: Shop
 *  - namespace: konsumentkollen
 *  - key: scrive_url
 */
const MF_NAMESPACE = "konsumentkollen";
const MF_KEY = "scrive_url";

function isValidHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

async function getShopId(admin) {
  const res = await admin.graphql(
    `#graphql
    query GetShopId {
      shop { id }
    }`,
  );
  const json = await res.json();
  return json?.data?.shop?.id;
}

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  // Läs Scrive-URL från shop-metafield
  const res = await admin.graphql(
    `#graphql
    query GetScriveUrl($namespace: String!, $key: String!) {
      shop {
        metafield(namespace: $namespace, key: $key) {
          value
        }
      }
    }`,
    {
      variables: { namespace: MF_NAMESPACE, key: MF_KEY },
    },
  );

  const data = await res.json();
  const scriveUrl = data?.data?.shop?.metafield?.value ?? "";

  return { scriveUrl };
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const scriveUrlRaw = String(formData.get("scriveUrl") ?? "").trim();

  // Basic säkerhet/robusthet
  if (scriveUrlRaw.length > 2048) {
    return { ok: false, error: "URL:en är för lång." };
  }
  if (scriveUrlRaw && !isValidHttpsUrl(scriveUrlRaw)) {
    return { ok: false, error: "Skriv in en giltig https-länk till Scrive." };
  }

  const shopId = await getShopId(admin);
  if (!shopId) {
    return { ok: false, error: "Kunde inte läsa shop-id. Försök igen." };
  }

  // Sätt shop-metafield (per butik)
  const mutationRes = await admin.graphql(
    `#graphql
    mutation SetScriveUrl($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: MF_NAMESPACE,
            key: MF_KEY,
            type: "single_line_text_field",
            value: scriveUrlRaw,
          },
        ],
      },
    },
  );

  const mutationJson = await mutationRes.json();
  const userErrors = mutationJson?.data?.metafieldsSet?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { ok: false, error: userErrors[0]?.message ?? "Okänt fel vid sparning." };
  }

  return { ok: true, scriveUrl: scriveUrlRaw };
}

export default function AdditionalPage() {
  const { scriveUrl: initialScriveUrl } = useLoaderData();
  const fetcher = useFetcher();

  const [scriveUrl, setScriveUrl] = useState(initialScriveUrl);

  // Om loadern uppdateras, synca in den i state
  useEffect(() => {
    setScriveUrl(initialScriveUrl);
  }, [initialScriveUrl]);

  const isSaving = fetcher.state !== "idle";
  const lastResult = fetcher.data;

  function handleSave() {
    const fd = new FormData();
    fd.set("scriveUrl", scriveUrl);
    fetcher.submit(fd, { method: "post" });
  }

  return (
    <s-page heading="Konsumentkollen – Widget Settings">
      {/* ----------------------- Widget Status ----------------------- */}
      <s-section heading="Widget status">
        <s-card>
          <s-paragraph>
            Aktivera Konsumentkollen-widget.
            <br />
            När widgeten är aktiv kan kunder lägga till Konsumentkollen direkt
            från butikens frontend, cart och checkout.
          </s-paragraph>

          <s-switch checked>Aktiv</s-switch>
        </s-card>
      </s-section>

      {/* ----------------------- Scrive Integration ----------------------- */}
      <s-section heading="Scrive-integration">
        <s-card>
          <s-paragraph>
            Koppla din Scrive-länk. Denna länk öppnas när kunden klickar på
            <strong> Starta bevakning</strong> i widgeten.
          </s-paragraph>

          <s-text-field
            label="Scrive URL"
            placeholder="https://scrive.com/sign/your-contract"
            value={scriveUrl}
            onInput={(e) => {
              // funkar för de flesta web components som exponerar .value
              const v = e?.target?.value ?? "";
              setScriveUrl(String(v));
            }}
          ></s-text-field>

          {lastResult?.ok && (
            <s-paragraph style={{ marginTop: "10px" }}>
              ✅ Sparat! Scrive-länken är nu uppdaterad för denna butik.
            </s-paragraph>
          )}

          {lastResult?.ok === false && (
            <s-paragraph style={{ marginTop: "10px" }}>
              ❌ {lastResult.error}
            </s-paragraph>
          )}
        </s-card>
      </s-section>

      {/* ----------------------- Widget Placement ----------------------- */}
      <s-section heading="Widget placering">
        <s-card>
          <s-paragraph>Välj var Konsumentkollen-widgeten ska synas i butiken.</s-paragraph>

          <s-select
            label="Placering"
            value="cart"
            options='[
              { "label": "Kundvagn", "value": "cart" },
              { "label": "Checkout", "value": "checkout" },
              { "label": "Produktsidor", "value": "product" }
            ]'
          ></s-select>
        </s-card>
      </s-section>

      {/* ----------------------- Preview (ASIDE LAYOUT) ----------------------- */}
      <s-section slot="aside" heading="Förhandsvisning av widgeten">
        <s-card>
          <s-paragraph>Så här kommer Konsumentkollen-widgeten se ut i din butik:</s-paragraph>

          <s-box
            padding="base"
            background="subdued"
            borderWidth="base"
            borderRadius="large"
          >
            <s-heading level="3">Konsumentkollen</s-heading>
            <s-paragraph>
              Skydda ditt köp och få hjälp vid tvister eller problem.
            </s-paragraph>

            <s-button
              variant="primary"
              size="large"
              onClick={() => {
                if (!scriveUrl || !isValidHttpsUrl(scriveUrl)) return;
                window.open(scriveUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Starta bevakning (preview)
            </s-button>
          </s-box>
        </s-card>
      </s-section>

      {/* ----------------------- Save Button ----------------------- */}
      <s-section>
        <s-button variant="primary" size="large" disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Sparar..." : "Spara inställningar"}
        </s-button>
      </s-section>
    </s-page>
  );
}
