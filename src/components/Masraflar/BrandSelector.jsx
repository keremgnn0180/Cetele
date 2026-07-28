import React, { memo } from "react";
import { ChevronDown } from "lucide-react";

import { NEW_BRAND_OPTION } from "./constants";
import { getBrandIcon } from "./helpers";

function BrandSelector({
  kategori,
  form,
  setForm,
  isManualBrand,
  newBrand,
  setNewBrand,
  brandOptions,
  brandDropdownOpen,
  setBrandDropdownOpen,
}) {
  if (isManualBrand) {
    return (
      <input
        type="text"
        className="form-control"
        placeholder="Marka"
        value={newBrand}
        onChange={(e) => setNewBrand(e.target.value)}
        required
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="form-control"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          width: "100%",
          cursor: "pointer",
          background: "var(--white)",
        }}
        onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {form.gubre_marka ? (
            <>
              {(() => {
                const Icon = getBrandIcon(kategori, form.gubre_marka);
                return (
                  <Icon size={16} style={{ color: "var(--primary-600)" }} />
                );
              })()}
              {form.gubre_marka}
            </>
          ) : (
            "Marka seç"
          )}
        </span>
        <ChevronDown size={16} style={{ color: "var(--slate-400)" }} />
      </button>
      {brandDropdownOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            background: "var(--white)",
            border: "1px solid var(--slate-200)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            marginTop: "4px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {brandOptions.map((brand) => {
            const Icon = getBrandIcon(kategori, brand);
            return (
              <button
                key={brand}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px 12px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "var(--slate-700)",
                }}
                onClick={() => {
                  setForm({
                    ...form,
                    gubre_marka: brand,
                    gubre_turu: "",
                    gubre_cesit: "",
                  });
                  setBrandDropdownOpen(false);
                }}
              >
                <Icon size={16} style={{ color: "var(--primary-500)" }} />
                <span>{brand}</span>
              </button>
            );
          })}
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "var(--primary-600)",
              fontWeight: "600",
              borderTop: "1px solid var(--slate-100)",
            }}
            onClick={() => {
              setForm({
                ...form,
                gubre_marka: NEW_BRAND_OPTION,
              });
              setBrandDropdownOpen(false);
            }}
          >
            {NEW_BRAND_OPTION}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(BrandSelector);
