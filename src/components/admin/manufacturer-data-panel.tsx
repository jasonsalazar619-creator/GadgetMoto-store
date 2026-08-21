import type { AdminProductEditorData } from "@/lib/admin/products/types";

const regionLabels = {
  ph: "Philippines",
  sea: "Southeast Asia",
  regional: "Official regional",
  global: "Global",
} as const;

const statusLabels = {
  verified: "Verified",
  partial: "Partially verified",
  needs_manual_verification: "Needs manual verification",
} as const;

function memoryLabel(
  physicalRamGb: number | null,
  physicalRamNotPublished: boolean,
  extendedRamGb: number | null,
  storageGb: number,
) {
  const ram = physicalRamNotPublished
    ? "RAM not published"
    : `${physicalRamGb}GB RAM${extendedRamGb ? ` + ${extendedRamGb}GB extended` : ""}`;
  const storage = storageGb === 1024 ? "1TB" : `${storageGb}GB`;
  return `${ram} · ${storage} storage`;
}

export function ManufacturerDataPanel({
  product,
}: {
  product: AdminProductEditorData;
}) {
  const { sources, variants, colors, combinations } =
    product.manufacturerResearch;

  return (
    <section className="admin-product-configurations__section admin-manufacturer-data">
      <details>
        <summary>
          <span>
            <small className="eyebrow">Verified research</small>
            <strong>Manufacturer Data</strong>
          </span>
          <span>{sources.length ? `${sources.length} source${sources.length === 1 ? "" : "s"}` : "Needs research"}</span>
        </summary>
        <div className="admin-manufacturer-data__content">
          {sources.length ? (
            <div className="admin-manufacturer-data__sources">
              {sources.map((source) => (
                <article key={source.id}>
                  <div>
                    <a href={source.url} rel="noreferrer" target="_blank">
                      {source.name}
                    </a>
                    <span>{regionLabels[source.region]}</span>
                  </div>
                  <b data-status={source.status}>{statusLabels[source.status]}</b>
                  {source.notes ? <p>{source.notes}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-color-checklist__empty">
              No exact official manufacturer source has been verified for this
              catalog record. No configuration was invented.
            </p>
          )}

          <div className="admin-manufacturer-data__grid">
            <div>
              <h3>Verified colors</h3>
              {colors.length ? (
                <ul>
                  {colors.map((color) => (
                    <li key={color.id}>
                      <span
                        aria-hidden="true"
                        className="admin-color-card__swatch"
                        style={{ background: color.hexCode ?? "var(--color-ice)" }}
                      />
                      <span>{color.officialName}</span>
                      <small>
                        {color.mappedProductColorId
                          ? "Commercial color mapped"
                          : "Commercial setup incomplete"}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No official finish list verified.</p>
              )}
            </div>

            <div>
              <h3>Verified memory / storage</h3>
              {variants.length ? (
                <ul>
                  {variants.map((variant) => (
                    <li key={variant.id}>
                      <span>
                        {memoryLabel(
                          variant.physicalRamGb,
                          variant.physicalRamNotPublished,
                          variant.extendedRamGb,
                          variant.storageGb,
                        )}
                      </span>
                      <small>
                        {variant.mappedProductVariantId
                          ? "Commercial SKU / price mapped"
                          : "Needs SKU / price"}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No official memory/storage matrix verified.</p>
              )}
            </div>
          </div>

          <div className="admin-manufacturer-data__combinations">
            <h3>Exact manufacturer combinations</h3>
            {combinations.length ? (
              <ul>
                {combinations.map((combination) => (
                  <li key={combination.id}>
                    <strong>{combination.color.officialName}</strong>
                    <span>
                      {memoryLabel(
                        combination.variant.physicalRamGb,
                        combination.variant.physicalRamNotPublished,
                        combination.variant.extendedRamGb,
                        combination.variant.storageGb,
                      )}
                    </span>
                    <small>
                      {combination.variant.mappedProductVariantId &&
                      combination.color.mappedProductColorId
                        ? "Commercially mapped · availability remains OFF until checked"
                        : "Needs SKU / price or commercial color mapping"}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                The official sources do not prove exact color-to-memory pairings,
                so no Cartesian combinations were created.
              </p>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
