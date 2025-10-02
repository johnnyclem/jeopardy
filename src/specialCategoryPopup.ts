import { querySelectorAndCheck } from "./commonFunctions";
import { SpecialCategory } from "./specialCategories";

export interface SpecialCategoryPopupElements {
    readonly container: HTMLDivElement;
    readonly title: HTMLElement;
    readonly description: HTMLElement;
    readonly exampleCategory: HTMLElement;
    readonly exampleQuestion: HTMLElement;
    readonly exampleAnswer: HTMLElement;
}

export function initSpecialCategoryPopup(parent: ParentNode): SpecialCategoryPopupElements {
    const container = querySelectorAndCheck<HTMLDivElement>(parent, "div#special-category-popup");
    return {
        container,
        title: querySelectorAndCheck(container, ".popup-title"),
        description: querySelectorAndCheck(container, "#special-category-popup-description"),
        exampleCategory: querySelectorAndCheck(container, "#special-category-popup-example-category"),
        exampleQuestion: querySelectorAndCheck(container, "#special-category-popup-example-question"),
        exampleAnswer: querySelectorAndCheck(container, "#special-category-popup-example-answer"),
    };
}

export function setSpecialCategoryPopupContent(
    elements: SpecialCategoryPopupElements,
    specialCategory: SpecialCategory,
): void {
    elements.title.innerHTML = specialCategory.DISPLAY_NAME;
    elements.description.innerHTML = specialCategory.DESCRIPTION;

    if (specialCategory.EXAMPLE) {
        elements.container.classList.remove("no-example");
        elements.exampleCategory.innerHTML = specialCategory.EXAMPLE.CATEGORY;
        elements.exampleQuestion.innerHTML = specialCategory.EXAMPLE.QUESTION;
        elements.exampleAnswer.innerHTML = specialCategory.EXAMPLE.ANSWER;
    } else {
        elements.container.classList.add("no-example");
    }
}
