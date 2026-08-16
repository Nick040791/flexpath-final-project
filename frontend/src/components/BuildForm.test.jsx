import { render, screen, fireEvent } from "@testing-library/react";
import BuildForm from "./BuildForm";

// Test 1: Defaults  name = "" description = "" Public = true
describe("BuildForm", () => {
    test("starts with default empty values", () => {
        const onSubmit = jest.fn();
        render(<BuildForm onSubmit={onSubmit} />);
        expect(screen.getByLabelText(/Name/i).value).toBe("");
        expect(screen.getByLabelText(/Description/i).value).toBe("");
        expect(screen.getByLabelText(/Public/i).checked).toBe(true);
    });
});

/**Test 2: Submission 
 * Fill: Name: Budget Gaming PC, Description: Gaming build under $1000, Public: false
 * Expected callback:
 *  {
 *    name: "Budget Gaming PC",
 *    description: "Gaming build under $1000",
 *    is_Public: false
 *  }
 */
describe("BuildForm Submission", () => {
    test("submits the form with correct values", () => {
        const onSubmit = jest.fn();
        render(<BuildForm onSubmit={onSubmit} />);
        
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Budget Gaming PC" } });
        fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "Gaming build under $1000" } });
        fireEvent.click(screen.getByLabelText(/Public/i)); // Toggle to false
        
        fireEvent.click(screen.getByText(/Save/i));
        
        expect(onSubmit).toHaveBeenCalledWith({
            name: "Budget Gaming PC",
            description: "Gaming build under $1000",
            is_Public: false
        });
    });
});

// Test 3: Blank Description - description = "" should become: description: null
describe("BuildForm Blank Description", () => {
    test("submits with null description when left blank", () => {
        const onSubmit = jest.fn();
        render(<BuildForm onSubmit={onSubmit} />);
        
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Budget Gaming PC" } });
        // Leave description blank
        fireEvent.click(screen.getByText(/Save/i));
        
        expect(onSubmit).toHaveBeenCalledWith({
            name: "Budget Gaming PC",
            description: null,
            is_Public: true
        });
    });
});

/**Test 4: Cancel/Edit/Submit Behavior 
 *Verify: initial values populate, Cancel invokes onCancel, submitting disables Save, submitting displays Saving...*/
describe("BuildForm Cancel/Edit/Submit Behavior", () => {
    test("initial values populate, Cancel invokes onCancel, submitting disables Save, submitting displays Saving...", () => {
        const onSubmit = jest.fn();
        const onCancel = jest.fn();
        render(<BuildForm onSubmit={onSubmit} onCancel={onCancel} initialValues={{ name: "Initial Name", description: "Initial Description", is_Public: true }} />);
        
        // Verify initial values
        expect(screen.getByLabelText(/Name/i).value).toBe("Initial Name");
        expect(screen.getByLabelText(/Description/i).value).toBe("Initial Description");
        expect(screen.getByLabelText(/Public/i).checked).toBe(true);
        
        // Click Cancel
        fireEvent.click(screen.getByText(/Cancel/i));
        expect(onCancel).toHaveBeenCalled();
        
        // Submit the form
        fireEvent.click(screen.getByText(/Save/i));
        
        // Verify Save button is disabled and shows "Saving..."
        expect(screen.getByText(/Saving.../i)).toBeDisabled();
    });
});