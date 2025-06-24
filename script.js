// A map of infix math operators to their corresponding functions
const infixToFunction = {
    "+": (x, y) => x + y,        // Addition
    "-": (x, y) => x - y,        // Subtraction
    "*": (x, y) => x * y,        // Multiplication
    "/": (x, y) => x / y,        // Division
};

// Replaces a math operation in the string using the given regex
const infixEval = (str, regex) =>
  str.replace(regex, (_match, arg1, operator, arg2) =>
    infixToFunction[operator](parseFloat(arg1), parseFloat(arg2))
  );

// Recursively evaluates high-precedence operations (* and / first)
const highPrecedence = str => {
    const regex = /([\d.]+)([*\/])([\d.]+)/; // Matches a * or / expression
    const str2 = infixEval(str, regex); // Evaluate it
    return str === str2 ? str : highPrecedence(str2); // Repeat until no change
};

// Checks if a number is even
const isEven = num => num % 2 === 0;

// Adds up all numbers in an array
const sum = nums => nums.reduce((acc, el) => acc + el, 0);

// Calculates average from an array of numbers
const average = nums => sum(nums) / nums.length;

// Calculates the median (middle value) from an array
const median = nums => {
    const sorted = nums.slice().sort((a, b) => a - b); // Clone and sort
    const length = sorted.length;
    const middle = length / 2 - 1; // For even arrays, this is the lower middle index
    return isEven(length)
        ? average([sorted[middle], sorted[middle + 1]]) // Average of 2 middle values
        : sorted[Math.ceil(middle)]; // Middle value for odd-length array
};

// A map of function names to logic that processes number arrays
const spreadsheetFunctions = {
  "": (nums) => nums,                        // No function = identity
  sum,                                       // Sum of values
  average,                                   // Average
  median,                                    // Median
  even: nums => nums.filter(isEven),        // Only even numbers
  someeven: nums => nums.some(isEven),      // True if any even
  everyeven: nums => nums.every(isEven),    // True if all even
  firsttwo: nums => nums.slice(0, 2),       // First two numbers
  lasttwo: nums => nums.slice(-2),          // Last two numbers
  has2: nums => nums.includes(2),           // True if number 2 is present
  increment: nums => nums.map(num => num + 1), // Add 1 to each number
  random: ([x, y]) => Math.floor(Math.random() * y + x), // Random number between x and x+y
  range: nums => range(...nums),            // Generate a range
  nodupes: nums => [...new Set(nums).values()] // Remove duplicates
};

// Applies the spreadsheet function to the formula string
const applyFunction = str => {
    const noHigh = highPrecedence(str); // Handle * and / first
    const infix = /([\d.]+)([+-])([\d.]+)/; // Regex for + or - operations
    const str2 = infixEval(noHigh, infix); // Evaluate + and -

    // Regex to match something like sum(1,2,3)
    const functionCall = /([a-z0-9]*)\(([0-9., ]*)\)(?!.*\()/i;

    // Converts comma-separated string into number array
    const toNumberList = args => args.split(",").map(parseFloat);

    // Applies the correct spreadsheet function
    const apply = (fn, args) => spreadsheetFunctions[fn.toLowerCase()](toNumberList(args));

    // Replace matched function call with its result
    return str2.replace(functionCall, (match, fn, args) =>
        spreadsheetFunctions.hasOwnProperty(fn.toLowerCase()) ? apply(fn, args) : match
    );
};

// Generates an array from start to end (inclusive)
const range = (start, end) => Array(end - start + 1).fill(start).map((element, index) => element + index);

// Same as range, but with letters (e.g. A to F)
const charRange = (start, end) =>
  range(start.charCodeAt(0), end.charCodeAt(0)).map(code => String.fromCharCode(code));

// Main function to evaluate a formula from the spreadsheet
const evalFormula = (x, cells) => {
    const idToText = id => cells.find(cell => cell.id === id).value; // Get text from input by ID

    // Regex to match cell ranges like A1:B2
    const rangeRegex = /([A-J])([1-9][0-9]?):([A-J])([1-9][0-9]?)/gi;

    // Get number range between two numbers (e.g. 1 to 3)
    const rangeFromString = (num1, num2) => range(parseInt(num1), parseInt(num2));

    // Helper to get value from a cell like A1
    const elemValue = num => character => idToText(character + num);

    // Gets all cell values for a 2D range like A1 to B3
    const addCharacters = character1 => character2 => num =>
        charRange(character1, character2).map(elemValue(num));

    // Replace A1:B2 with list of cell values inside
    const rangeExpanded = x.replace(rangeRegex, (_match, char1, num1, char2, num2) =>
        rangeFromString(num1, num2).map(addCharacters(char1)(char2))
    );

    // Match single cell like A1, B3 etc.
    const cellRegex = /[A-J][1-9][0-9]?/gi;

    // Replace all cell references with their values
    const cellExpanded = rangeExpanded.replace(cellRegex, match => idToText(match.toUpperCase()));

    // Apply spreadsheet function if present
    const functionExpanded = applyFunction(cellExpanded);

    // Repeat if there's still more to process (recursive)
    return functionExpanded === x ? functionExpanded : evalFormula(functionExpanded, cells);
};

// When page loads, create the spreadsheet grid
window.onload = () => {
    const container = document.getElementById("container"); // Container div

    // Create top labels A-F
    const createLabel = (name) => {
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = name;
        container.appendChild(label);
    };

    const letters = charRange("A", "F"); // A to F
    letters.forEach((letter) => {
        createLabel(letter);
    });

    // Create rows and input boxes
    range(1, 19).forEach(number => {
        createLabel(number); // Row label
        letters.forEach(letter => {
            const input = document.createElement("input");
            input.type = "text";
            input.id = letter + number;
            input.ariaLabel = letter + number;
            input.onchange = update; // When value changes
            container.appendChild(input);
        });
    });
};

// When input box is changed by user
const update = event => {
    const element = event.target;
    const value = element.value.replace(/\s/g, ""); // Remove spaces

    // If input starts with = and doesn’t refer to itself
    if (!value.includes(element.id) && value.startsWith('=')) {
        // Evaluate formula and update the input
        element.value = evalFormula(value.slice(1), Array.from(document.getElementById("container").children));
    }
};
