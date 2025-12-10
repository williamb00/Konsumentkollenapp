export default function AdditionalPage() {
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

          <s-switch checked>
            Aktiv
          </s-switch>
        </s-card>
      </s-section>

      {/* ----------------------- Scrive Integration ----------------------- */}
      <s-section heading="Scrive-integration">
        <s-card>
          <s-paragraph>
            Koppla din Scrive-länk. Denna länk öppnas när kunden klickar på
            Aktivera Konsumentkollen i widgeten.
          </s-paragraph>

          <s-text-field
            label="Scrive URL"
            placeholder="https://scrive.com/sign/your-contract"
          ></s-text-field>
        </s-card>
      </s-section>

      {/* ----------------------- Widget Placement ----------------------- */}
      <s-section heading="Widget placering">
        <s-card>
          <s-paragraph>
            Välj var Konsumentkollen-widgeten ska synas i butiken.
          </s-paragraph>

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

            <s-button variant="primary" size="large">
              Aktivera Konsumentkollen
            </s-button>
          </s-box>
        </s-card>
      </s-section>

      {/* ----------------------- Save Button ----------------------- */}
      <s-section>
        <s-button variant="primary" size="large">
          Spara inställningar
        </s-button>
      </s-section>
    </s-page>
  );
}

