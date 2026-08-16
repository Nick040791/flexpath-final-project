// Test 1: initial state - Verify: name empty, category empty, price empty, public checked, and the component defaults is_Public to true
describe("PartForm Initial State", () => {
   test("renders with default empty values", () => {
      const onSubmit = jest.fn();
      render(<PartForm onSubmit={onSubmit} />);
      
      expect(screen.getByLabelText(/Name/i).value).toBe("");
      expect(screen.getByLabelText(/Category/i).value).toBe("");
      expect(screen.getByLabelText(/Brand/i).value).toBe("");
      expect(screen.getByLabelText(/Model/i).value).toBe("");
      expect(screen.getByLabelText(/Price/i).value).toBe("");
      expect(screen.getByLabelText(/Description/i).value).toBe("");
      expect(screen.getByLabelText(/Public/i).checked).toBe(true);
   });
});

/** Test 2: Valid populated form
 * Verify: Name RTX 4070 Super, Brand NVIDIA, Model: 4070 Super, Price: 599.99, Description: 1440p GPU, Public: false
 *  onSubmit should be called with the correct parameters -> expected:
 * {
 *   name: "RTX 4070 Super",
 *   category: "GPU",
 *   brand: "NVIDIA",
 *   model: "4070 Super",
 *   price: 599.99,
 *   description: "1440p GPU",
 *   is_Public: false
 * input value = "599.99"
 * submitted value = 599.99
 * }
 */
describe("PartForm Valid Submission", () => {
   test("submits the form with correct values", () => {
      const onSubmit = jest.fn();
      render(<PartForm onSubmit={onSubmit} />);
      
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "RTX 4070 Super" } });
      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "GPU" } });
      fireEvent.change(screen.getByLabelText(/Brand/i), { target: { value: "NVIDIA" } });
      fireEvent.change(screen.getByLabelText(/Model/i), { target: { value: "4070 Super" } });
      fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: "599.99" } });
      fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "1440p GPU" } });
      fireEvent.click(screen.getByLabelText(/Public/i)); // Toggle to false
      
      fireEvent.click(screen.getByText(/Save/i));
      
      expect(onSubmit).toHaveBeenCalledWith({
         name: "RTX 4070 Super",
         category: "GPU",
         brand: "NVIDIA",
         model: "4070 Super",
         price: 599.99,
         description: "1440p GPU",
         is_Public: false
      });
   });
});

// Test 3: Optional Fields - Use valid: name, category - but leave: brand, model, price, and description empty.
// Expected: brand: null, model: null, price: null, description: null
describe("PartForm Optional Fields", () => {
   test("submits with null for optional fields when left blank", () => {
      const onSubmit = jest.fn();
      render(<PartForm onSubmit={onSubmit} />);
      
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "RTX 4070 Super" } });
      fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "GPU" } });
      // Leave brand, model, price, description blank
      
      fireEvent.click(screen.getByText(/Save/i));
      
      expect(onSubmit).toHaveBeenCalledWith({
         name: "RTX 4070 Super",
         category: "GPU",
         brand: null,
         model: null,
         price: null,
         description: null,
         is_Public: true // default
      });
   });
});

//Test 4: Edit State - Pass an initial object. -> Verify its values populate the form. This covers: ...initial and: price: initial?.price ?? ""
describe("PartForm Edit State", () => {
   test("populates form with initial values", () => {
      const initial = {
         name: "RTX 4070 Super",
         category: "GPU",
         brand: "NVIDIA",
         model: "4070 Super",
         price: 599.99,
         description: "1440p GPU",
         is_Public: false
      };
      
      const onSubmit = jest.fn();
      render(<PartForm onSubmit={onSubmit} initial={initial} />);
      
      expect(screen.getByLabelText(/Name/i).value).toBe(initial.name);
      expect(screen.getByLabelText(/Category/i).value).toBe(initial.category);
      expect(screen.getByLabelText(/Brand/i).value).toBe(initial.brand);
      expect(screen.getByLabelText(/Model/i).value).toBe(initial.model);
      expect(screen.getByLabelText(/Price/i).value).toBe(initial.price.toString());
      expect(screen.getByLabelText(/Description/i).value).toBe(initial.description);
      expect(screen.getByLabelText(/Public/i).checked).toBe(initial.is_Public);
   });
});

// Test 5: Submitting State With: submitting={true} Verify: button disabled, button text = Saving...
describe("PartForm Submitting State", () => {
   test("disables Save button and shows 'Saving...' when submitting", () => {
      const onSubmit = jest.fn();
      render(<PartForm onSubmit={onSubmit} submitting={true} />);
      
      const saveButton = screen.getByText(/Saving.../i);
      expect(saveButton).toBeDisabled();
   });
});

// Test 6: Cancel Supply: onCancel -> click: Cancel -> and verify callback executed.
describe("PartForm Cancel", () => {
   test("calls onCancel when Cancel button is clicked", () => {
      const onCancel = jest.fn();
      render(<PartForm onSubmit={jest.fn()} onCancel={onCancel} />);
      
      fireEvent.click(screen.getByText(/Cancel/i));
      expect(onCancel).toHaveBeenCalled();
   });
});
