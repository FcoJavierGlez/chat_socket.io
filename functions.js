/* export const functions = ( () => {
    const formatDate = date => date < 10 ? `0${date}` : date;

    return {
        formatDate: formatDate,
    }
})(); */
const formatDate = date => date < 10 ? `0${date}` : date;

/* export { formatDate }; */

module.exports = formatDate;