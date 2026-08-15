function average(numbers){
    if (!numbers.length) {
        return 0;
    }
    const total = numbers.reduce((sum, number) => sum + number, 0)
    return total / numbers.length;
};
function median(numbers){
    if (!numbers.length) {return 0;}

    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedNumbers.length / 2);

    if (sortedNumbers.length % 2 === 1){
        return sortedNumbers[middleIndex];
    }
    return (sortedNumbers[middleIndex -1] + sortedNumbers[middleIndex]) / 2;
};

function formatNumber(value){
    return Number(value).toLocaleString('en-us', {
        maximumFractionDigits: 2});
};
export { average, median, formatNumber };