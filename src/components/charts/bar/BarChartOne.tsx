import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Box, useTheme } from "@mui/material";

export default function BarChartOne() {
  const theme = useTheme();
  const options: ApexOptions = {
    colors: [theme.palette.primary.main],
    chart: {
      fontFamily: "Poppins, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Poppins",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      theme: theme.palette.mode,
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: "Sales",
      data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    },
  ];
  return (
    <Box sx={{ maxWidth: "100%", overflowX: "auto" }}>
      <Box id="chartOne" sx={{ minWidth: { xs: 760, lg: 0 } }}>
        <Chart options={options} series={series} type="bar" height={180} />
      </Box>
    </Box>
  );
}
