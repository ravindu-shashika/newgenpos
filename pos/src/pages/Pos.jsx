import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

const mockProducts = [
    { id: 1, name: "Wireless Headphones", price: 129.99, image: "🎧", category: "Electronics" },
    { id: 2, name: "Mechanical Keyboard", price: 89.99, image: "⌨️", category: "Electronics" },
    { id: 3, name: "Gaming Mouse", price: 59.99, image: "🖱️", category: "Electronics" },
    { id: 4, name: "Coffee Mug", price: 12.50, image: "☕", category: "Home" },
    { id: 5, name: "Water Bottle", price: 24.99, image: "💧", category: "Home" },
    { id: 6, name: "Notebook", price: 5.99, image: "📓", category: "Office" },
    { id: 7, name: "Pen Set", price: 15.99, image: "🖊️", category: "Office" },
    { id: 8, name: "Desk Lamp", price: 45.00, image: "💡", category: "Home" },
];

const Pos = () => {
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", "Electronics", "Home", "Office"];

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const filteredProducts = mockProducts
        .filter(p => selectedCategory === "All" || p.category === selectedCategory)
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Products Grid */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    selectedCategory === cat
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-card hover:bg-muted"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="bg-card rounded-xl p-4 shadow-sm border hover:border-primary cursor-pointer transition-all hover:shadow-md flex flex-col gap-2"
                            onClick={() => addToCart(product)}
                        >
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-4xl">
                                {product.image}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            <div className="font-bold text-primary">${product.price.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 bg-card rounded-xl border shadow-sm flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Current Order
                    </h2>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{cart.length} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center bg-muted/30 p-2 rounded-lg">
                                <div className="h-12 w-12 bg-background rounded-md flex items-center justify-center text-xl border">
                                    {item.image}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                    <div className="text-muted-foreground text-xs">${item.price.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQty(item.id, -1)}
                                        className="h-6 w-6 rounded-md bg-background border flex items-center justify-center hover:text-destructive"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-4 text-center text-sm">{item.qty}</span>
                                    <button
                                        onClick={() => updateQty(item.id, 1)}
                                        className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-muted/20 border-t space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (10%)</span>
                            <span>${(total * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>${(total * 1.1).toFixed(2)}</span>
                        </div>
                    </div>
                    <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pos;
