import { useEffect, useMemo, useState } from "react";
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

  // Läs Scrive-URL från shop-metafield (per butik)
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
    return {
      ok: false,
      error: userErrors[0]?.message ?? "Okänt fel vid sparning.",
    };
  }

  return { ok: true, scriveUrl: scriveUrlRaw };
}

export default function AppIndexPage() {
  const { scriveUrl: initialScriveUrl } = useLoaderData();
  const fetcher = useFetcher();

  const [scriveUrl, setScriveUrl] = useState(initialScriveUrl);

  // Om loadern uppdateras, synca in den i state
  useEffect(() => {
    setScriveUrl(initialScriveUrl);
  }, [initialScriveUrl]);

  const isSaving = fetcher.state !== "idle";
  const lastResult = fetcher.data;

  const scriveIsValid = useMemo(() => {
    return scriveUrl && isValidHttpsUrl(scriveUrl);
  }, [scriveUrl]);

  function handleSave() {
    const fd = new FormData();
    fd.set("scriveUrl", scriveUrl);
    fetcher.submit(fd, { method: "post" });
  }

  return (
    <s-page heading="Konsumentkollen från ViPo Säkerhetstjänster">
      {/* ===================== Välkommen / Status ===================== */}
      <s-section>
        <s-card>
          <s-stack direction="block" gap="base">
            <s-heading level="2">Välkommen!</s-heading>

            <s-badge tone="success">Installerad och redo</s-badge>

            <s-paragraph>
              Konsumentkollen är installerad och redo att användas.
              <br />
              Nästa steg är att (1) lägga in din Scrive-länk nedan och (2) lägga
              till widgeten i temat via Theme Editor.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      {/* ===================== Scrive integration (VIKTIG) ===================== */}
      <s-section heading="Scrive-integration">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Klistra in din Scrive-länk här. Denna länk öppnas när kunden klickar
              på <strong>Starta bevakning</strong> i widgeten (både App Block och
              Cart Drawer).
            </s-paragraph>

            <s-text-field
              label="Scrive URL"
              placeholder="https://scrive.com/form/..."
              value={scriveUrl}
              onInput={(e) => {
                const v = e?.target?.value ?? "";
                setScriveUrl(String(v));
              }}
            ></s-text-field>

            {/* Feedback */}
            {lastResult?.ok && (
              <s-paragraph>
                ✅ Sparat! Scrive-länken är nu uppdaterad för denna butik.
              </s-paragraph>
            )}

            {lastResult?.ok === false && (
              <s-paragraph>❌ {lastResult.error}</s-paragraph>
            )}

            {/* Actions */}
            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                size="large"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Sparar..." : "Spara Scrive-länk"}
              </s-button>

              <s-button
                size="large"
                disabled={!scriveIsValid}
                onClick={() => {
                  if (!scriveIsValid) return;
                  window.open(scriveUrl, "_blank", "noopener,noreferrer");
                }}
              >
                Testa länken
              </s-button>
            </s-stack>

            <s-paragraph style={{ opacity: 0.85 }}>
              Tips: Varje butik sparar sin egen Scrive-länk (per installation).
              Det betyder att partner 1, 2 och 3 aldrig påverkar varandra.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      {/* ===================== Lägg till widgeten ===================== */}
      <s-section heading="Lägg till Konsumentkollen-widgeten">
        <s-card>
          <s-paragraph>
            Du lägger in widgeten i ditt tema via Shopify Theme Editor:
          </s-paragraph>

          <s-paragraph>
            • Gå till <strong>Webbshop → Teman</strong> och klicka <strong>Anpassa</strong>.
            <br />
            • Klicka <strong>Lägg till sektion/block</strong> och välj <strong>Konsumentkollen</strong>.
            <br />
            • Spara.
          </s-paragraph>

          <s-paragraph style={{ opacity: 0.85 }}>
            Tips: Om du inte ser blocket i Theme Editor, kontrollera att appens
            theme extension är aktiverad för temat.
          </s-paragraph>
        </s-card>
      </s-section>

      {/* ===================== Flöde ===================== */}
      <s-section heading="Så fungerar flödet (kund → Scrive → checkout)">
        <s-card>
          <s-paragraph>
            1) Kunden lägger produkter i varukorgen och ser Konsumentkollen i
            cart drawer / på sidan.
            <br />
            2) Kunden klickar <strong>Starta bevakning</strong> → öppnar Scrive-länken.
            <br />
            3) Efter signering kan Scrive skicka kunden vidare tillbaka till checkout
            (kundens egna session) för att slutföra köpet.
            <br />
            4) Webhook från Scrive kan trigga Make, som aktiverar tjänsten automatiskt
            och skickar bekräftelsemail.
          </s-paragraph>
        </s-card>
      </s-section>

      {/* ===================== Högerspalt ===================== */}
      <s-section slot="aside" heading="Om Konsumentkollen">
        <s-card>
          <s-paragraph>
            Konsumentkollen hjälper dina kunder att skydda sin identitet med bevakning
            och omedelbara larm vid förändringar kopplade till personnummer.
          </s-paragraph>

          <s-link href="https://vipo.se" target="_blank" rel="noopener noreferrer">
            Läs mer på vipo.se
          </s-link>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Support & tekniska frågor">
        <s-card>
          <s-paragraph>
            Behöver du hjälp med installationen eller har tekniska frågor?
          </s-paragraph>

          <s-paragraph>
            • E-post: <strong>william.bjorklund@vipo.se</strong>
          </s-paragraph>
        </s-card>
      </s-section>
    </s-page>
  );
}
