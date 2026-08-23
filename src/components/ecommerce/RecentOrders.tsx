import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const orders = [
  { id: 1, name: "MacBook Pro 13”", variants: "2 Variants", category: "Laptop", price: "$2,399.00", status: "Delivered", image: "/images/product/product-01.jpg" },
  { id: 2, name: "Apple Watch Ultra", variants: "1 Variant", category: "Watch", price: "$879.00", status: "Pending", image: "/images/product/product-02.jpg" },
  { id: 3, name: "iPhone 15 Pro Max", variants: "2 Variants", category: "Smartphone", price: "$1,869.00", status: "Delivered", image: "/images/product/product-03.jpg" },
  { id: 4, name: "iPad Pro 3rd Gen", variants: "2 Variants", category: "Electronics", price: "$1,699.00", status: "Canceled", image: "/images/product/product-04.jpg" },
  { id: 5, name: "AirPods Pro 2nd Gen", variants: "1 Variant", category: "Accessories", price: "$240.00", status: "Delivered", image: "/images/product/product-05.jpg" },
];

export default function RecentOrders() {
  return <Card><CardContent sx={{ p: 0 }}><Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" p={{ xs: 2.5, md: 3 }} spacing={2}><Box><Typography variant="h6">Recent Orders</Typography><Typography color="text.secondary" variant="body2">Latest product orders</Typography></Box><Stack direction="row" spacing={1}><Button color="inherit" startIcon={<FilterAltOutlinedIcon />} variant="outlined">Filter</Button><Button variant="outlined">See all</Button></Stack></Stack><TableContainer><Table sx={{ minWidth: 680 }}><TableHead><TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Price</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{orders.map((order) => <TableRow hover key={order.id}><TableCell><Stack alignItems="center" direction="row" spacing={1.5}><Avatar alt={order.name} src={order.image} variant="rounded" /><Box><Typography fontWeight={600} variant="body2">{order.name}</Typography><Typography color="text.secondary" variant="caption">{order.variants}</Typography></Box></Stack></TableCell><TableCell>{order.category}</TableCell><TableCell>{order.price}</TableCell><TableCell><Chip color={order.status === "Delivered" ? "success" : order.status === "Pending" ? "warning" : "error"} label={order.status} size="small" variant="outlined" /></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>;
}
