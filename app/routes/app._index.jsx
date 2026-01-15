import { useEffect, useMemo, useState } from "react";
import {
  useFetcher,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
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
    }`
  );
  const json = await res.json();
  return json?.data?.shop?.id;
}

export async function loader({ request }) {
  // Viktigt: Detta hanterar embedded auth/iframe. Om inte auth finns -> redirect.
  const { admin } = await authenticate.admin(request);

  // Målet: sidan ska alltid rendera något, även om GraphQL failar.
  let scriveUrl = "";
  let loadError = null;

  try {
    const res = await admin.graphql(
      `#graphql
      query GetScriveUrl($namespace: String!, $key: String!) {
        shop {
          metafield(namespace: $namespace, key: $key) { value }
        }
      }`,
      { variables: { namespace: MF_NAMESPACE, key: MF_KEY } }
    );

    const data = await res.json();

    // Shopify GraphQL kan returnera errors utan att throw:a.
    if (data?.errors?.length) {
      loadError = data.errors[0]?.message ?? "Okänt fel vid hämtning av Scrive-länk.";
    } else {
      scriveUrl = data?.data?.shop?.metafield?.value ?? "";
    }
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : "Kunde inte hämta Scrive-länk just nu. Försök igen.";
  }

  return { scriveUrl, loadError };
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const scriveUrlRaw = String(formData.get("scriveUrl") ?? "").trim();

  // Basic robusthet
  if (scriveUrlRaw.length > 2048) {
    return { ok: false, error: "URL:en är för lång." };
  }
  if (scriveUrlRaw && !isValidHttpsUrl(scriveUrlRaw)) {
    return { ok: false, error: "Skriv in en giltig https-länk till Scrive." };
  }

  try {
    const shopId = await getShopId(admin);
    if (!shopId) {
      return { ok: false, error: "Kunde inte läsa shop-id. Försök igen." };
    }

    const mutationRes = await admin.graphql(
      `#graphql
      mutation SetScriveUrl($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
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
      }
    );

    const mutationJson = await mutationRes.json();
    const userErrors = mutationJson?.data?.metafieldsSet?.userErrors ?? [];

    if (mutationJson?.errors?.length) {
      return {
        ok: false,
        error: mutationJson.errors[0]?.message ?? "Okänt fel vid sparning.",
      };
    }

    if (userErrors.length > 0) {
      return { ok: false, error: userErrors[0]?.message ?? "Okänt fel vid sparning." };
    }

    return { ok: true, scriveUrl: scriveUrlRaw };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Kunde inte spara just nu. Försök igen.",
    };
  }
}

export default function AppIndexPage() {
  const { scriveUrl: initialScriveUrl, loadError } = useLoaderData();
  const fetcher = useFetcher();

  const [scriveUrl, setScriveUrl] = useState(initialScriveUrl);

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
      <s-section>
        <s-card>
          <s-stack direction="block" gap="base">
            <s-heading level="2">Välkommen!</s-heading>

            <s-badge tone="success">Installerad och redo</s-badge>

            {/* Om loadern fick problem vill vi ändå visa sidan */}
            {loadError && (
              <s-paragraph style={{ color: "crimson" }}>
                ⚠️ Kunde inte läsa Scrive-länk just nu: {loadError}
                <br />
                Sidan fungerar fortfarande — du kan testa att spara igen.
              </s-paragraph>
            )}

            <s-paragraph>
              Konsumentkollen är installerad och redo att användas.
              <br />
              Nästa steg är att (1) lägga in din Scrive-länk nedan och (2) lägga
              till widgeten i temat via Theme Editor.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Scrive-integration">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Klistra in din Scrive-länk här. Denna länk öppnas när kunden klickar
              på <strong>Starta bevakning</strong> i widgeten.
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

            {lastResult?.ok && (
              <s-paragraph>✅ Sparat! Scrive-länken är nu uppdaterad för denna butik.</s-paragraph>
            )}

            {lastResult?.ok === false && (
              <s-paragraph style={{ color: "crimson" }}>❌ {lastResult.error}</s-paragraph>
            )}

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

      <s-section heading="Lägg till Konsumentkollen-widgeten">
        <s-card>
          <s-paragraph>Du lägger in widgeten i ditt tema via Shopify Theme Editor:</s-paragraph>

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

      <s-section heading="Så fungerar flödet (kund → Scrive → checkout)">
        <s-card>
          <s-paragraph>
            1) Kunden lägger produkter i varukorgen och ser Konsumentkollen.
            <br />
            2) Kunden klickar <strong>Starta bevakning</strong> → öppnar Scrive-länken.
            <br />
            3) Efter signering kan Scrive skicka kunden vidare tillbaka till checkout.
            <br />
            4) Webhook från Scrive kan trigga Make, som aktiverar tjänsten automatiskt.
          </s-paragraph>
        </s-card>
      </s-section>

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
          <s-paragraph>Behöver du hjälp med installationen eller har tekniska frågor?</s-paragraph>
          <s-paragraph>
            • E-post: <strong>william.bjorklund@vipo.se</strong>
          </s-paragraph>
        </s-card>
      </s-section>
    </s-page>
  );
}

/**
 * Extra viktigt: om något ändå kastar ett fel ska vi få en sida i Admin,
 * inte en grå “trasig ikon”.
 */
export function ErrorBoundary() {
  const error = useRouteError();

  let message = "Okänt fel.";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <s-page heading="ViPoAPP – Fel">
      <s-section>
        <s-card>
          <s-paragraph style={{ color: "crimson" }}>
            Något gick fel när appen skulle visas i Shopify Admin:
            <br />
            <strong>{message}</strong>
          </s-paragraph>
        </s-card>
      </s-section>
    </s-page>
  );
}
