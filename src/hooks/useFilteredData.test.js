import { renderHook } from "@testing-library/react-hooks";
import { useFilteredData, __test__ } from "./useFilteredData";

describe("useFilteredData", () => {
  const mockData = [
    {
      properties: {
        tipo: "tira",
        nombre: 56,
        plan: "077",
        id: 0,
      },
      geometry: {
        coordinates: [-60.727577, -32.9398],
      },
    },
  ];

  it("should return all items when no filters are active", () => {
    const filters = { edificio: "", vivienda: "", plan: "" };
    const { result } = renderHook(() => useFilteredData(mockData, filters));
    expect(result.current).toEqual(mockData);
  });

  it("should filter by edificio correctly", () => {
    const filters = { edificio: "56", vivienda: "", plan: "" };
    const { result } = renderHook(() => useFilteredData(mockData, filters));
    expect(result.current).toHaveLength(1);
  });

  it("should handle invalid input gracefully", () => {
    const { result } = renderHook(() => useFilteredData(null, {}));
    expect(result.current).toEqual([]);
  });
});
