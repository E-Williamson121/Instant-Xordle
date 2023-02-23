import 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js';

// utility function for converting a number to a label. If the value is 0 mod 10, keep it, otherwise it is blank.
function labelify(val) {
    if (val % 10 == 0){
        return val;
    }
    return "";
}

// function for updating a chart based on given data.
export function refresh_chart(data, darkness) {
    // first, count all the occurences of values in the data.
    let count = {}

    // counts are 0 by default.
    for (var j=0; j<60; j++) {
        count[j] = 0;
    }

    for (const element of data) {
        if (count[element]) {
            count[element] += 1;
        } else {
            count[element] = 1;
        }
    }

    // bar labels
    var bar_labels = Object.keys(count);
    bar_labels = bar_labels.map(x => labelify(x));

    // bar heights and colours
    var bar_heights = Object.values(count);
    if (darkness) {
        var bar_colours = Array(60).fill("#57ac57");
    } else {
        var bar_colours = Array(60).fill("#57ac57");
    }

    // custom chart colours for dark mode
    let fontcol = "";
    let linecol = "";
    let tooltipbg = "";
    let tooltipfont = "";
    if (darkness) {
        fontcol = "white";
        linecol = "rgba(255, 255, 255, 0.4)";
        tooltipbg = "rgba(255, 255, 255, 0.8)";
        tooltipfont = "#000"
    } else {
        fontcol = "black"
        linecol = "rgba(0, 0, 0, 0.3)";
        tooltipbg = "rgba(0, 0, 0, 0.8)";
        tooltipfont = "#fff"
    }

    // generate new chart in its place
    let chart = (new Chart("myChart", {
        type: "bar",
        data: {
            labels: bar_labels,
            datasets: [{
                backgroundColor: bar_colours,
                data: bar_heights
            }]
        },
        options: {
            legend: {display: false},
            scales: {
                xAxes: [{ticks: {fontColor: fontcol, min: 0, max: 60, stepSize: 10}, 
                    gridLines: {tickColor: "#fff", drawOnChartArea: false, color: linecol, ticklength: 0}}],          
                yAxes: [{display: false, ticks: {min:0}}]
            },
            tooltips: {
                backgroundColor: tooltipbg,
                bodyFontColor: tooltipfont,
                titleFontColor: tooltipfont,
                callbacks: {
                    title: function(x) {return `${x[0].index}`},
                }
            }
        }
    }));

    return chart;
}