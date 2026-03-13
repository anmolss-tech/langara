
// const imageUrls = {
//     productImage1: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-1.webp",
//     productImage2: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-2.webp",
//     productImage3: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-3.jpeg",
//     sizeChart: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/size-chart.webp",
//     customerProfile: "https://firebasestorage.googleapis.com/v0/b/rentique-teama.firebasestorage.app/o/autoPopulate%2Fid_1%2Fmichael_smith.jpg?alt=media&token=03a3b5c2-4c84-4f11-8543-0b86b00db38e",
//     businessLogo: "https://firebasestorage.googleapis.com/v0/b/rentique-teama.firebasestorage.app/o/autoPopulate%2Fid_1%2FnorthBanqLogo.png?alt=media&token=42f48491-313f-4a94-be67-cd59f687efad"
// };

const imageUrls = {
    // productImage1: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-1.webp",
    // productImage2: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-2.webp",
    // productImage3: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/denim-3.jpeg",
    sizeChart: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/size-chart.webp",
    // customerProfile: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/c1.jpg",
    // businessLogo: "https://hj9slueyk4ap4bfj.public.blob.vercel-storage.com/b1.png"
};
const addItemData = {
    itemName: '',
    description: '',    
    // itemName: 'Green Plaid Quarter-Zip Pullover',
    // description: 'A classic and versatile layering piece. This quarter-zip pullover features a timeless green plaid pattern, perfect for adding a touch of sophistication to your casual wardrobe.',
    // price: 125.00, // Estimated price
    // categories: ['Sweaters & Knits'],
    colors: ['Green', 'Navy', 'Black'],
    genders: ['Men'],
    sizes: ['M', 'L', 'XL'],
    sizeFit: ['regular-fit'],
    textures: ['Soft', 'Knitted'],
    seasons: ['Autumn', 'Winter'],
    styles: ['Casual', 'Preppy'],
    materials: ['Cotton', 'Polyester'], // Likely a cotton blend based on appearance
    // images: [imageUrls.productImage1, imageUrls.productImage2, imageUrls.productImage3],
    measurementTableUrl: imageUrls.sizeChart
};
// const addItemData = {
//     itemName: '',
//     description: '',
//     // itemName: 'Black Shiny Puffer Jacket',
//     // description: 'A timeless piece for any wardrobe. Perfect for a casual look, made from high-quality, durable jacket.',
//     // price: 45.00,
//     // categories: ['Outerwear (Coats & Jackets)'],
//     colors: ['Black'],
//     genders: ['Unisex'],
//     sizes: ['M', 'L'],
//     sizeFit: ['regular-fit'],
//     textures: ['Shiny', 'Smooth'],
//     seasons: ['Winter', 'Autumn'],
//     styles: ['Casual', 'Preppy', 'Y2K'],
//     materials: ['Nylon', 'Polyester'],
//     // images: [imageUrls.productImage1, imageUrls.productImage2, imageUrls.productImage3],
//     measurementTableUrl: imageUrls.sizeChart
// };


export const customerSignupData = {
    email: 'jack@gmail.com',
    password: 'password123',
    username: 'Jack Doe',
    address: '2375 Upland Dr, Vancouver, BC V5S 2B4',
    // profileImageUrl: imageUrls.customerProfile,
    // Questionnaire data
    height: '170',
    weight: '75', 
    gender: 'Male',
    favoriteColors: ['Black'], 
    favoriteStyles: ['Casual'], 
    stylesToTry: ['Minimalist', 'Party'] 
};


export const businessSignupData = {
    email: 'attireadmire@gmail.com',
    password: 'password123',
    brandName: 'Attire Admire',
    brandAddress: '3810 Jacombs Rd, Richmond, BC V6V 1Y6',
    // brandLogoUrl: imageUrls.businessLogo
};

// const addItemData = {
//     // itemName: '',
//     // description: '',
//     itemName: 'Classic Denim Jacket',
//     description: 'A timeless piece for any wardrobe. Perfect for a casual look, made from high-quality, durable denim.',
//     price: 45.00,
//     categories: ['Outerwear', 'Blazers'],
//     colors: ['Blue', 'Navy'],
//     genders: ['Unisex'],
//     sizes: ['M', 'L'],
//     sizeFit: ['regular-fit'],
//     textures: ['Textured', 'Rough'],
//     seasons: ['Spring', 'Autumn'],
//     styles: ['Casual', 'Preppy', 'Sporty'],
//     materials: ['Denim', 'Cotton'],
//     images: [imageUrls.productImage1, imageUrls.productImage2, imageUrls.productImage3],
//     measurementTableUrl: imageUrls.sizeChart
// };


// export const customerSignupData = {
//     email: 'dummyZC1@test.com',
//     password: 'password123',
//     username: 'Mikhael Rooney',
//     address: '2375 Upland Dr, Vancouver, BC V5S 2B4',
//     profileImageUrl: imageUrls.customerProfile,
//     // Questionnaire data
//     height: '170',
//     weight: '75', 
//     gender: 'Male',
//     favoriteColors: ['Blue'], 
//     favoriteStyles: ['Casual'], 
//     stylesToTry: ['Minimalist', 'Party'] 
// };

// export const businessSignupData = {
//     email: 'dummyZB1@test.com',
//     password: 'password123',
//     brandName: 'North BanQ',
//     brandAddress: '3810 Jacombs Rd, Richmond, BC V6V 1Y6',
//     brandLogoUrl: imageUrls.businessLogo
// };

export function initializeAutopopulate() {
    const autopopulateBtn = document.getElementById('dev-autopopulate-btn');
    if (!autopopulateBtn) return;

    autopopulateBtn.addEventListener('click', () => {
        console.log('✨ Auto-populate triggered!');
        const currentPath = window.location.href;

        const addItemForm = document.getElementById('bAddItemForm');
        if (addItemForm && currentPath.includes('b-add-item')) {
            const event = new CustomEvent('autopopulate-data', {
                bubbles: true,
                detail: { ...addItemData }
            });
            addItemForm.dispatchEvent(event);
        }
        
        else if (document.getElementById('signupForm') && currentPath.includes('auth-signup-customer')) {
            const event = new CustomEvent('autopopulate-data', {
                bubbles: true,
                detail: { ...customerSignupData }
            });
            document.getElementById('signupForm').dispatchEvent(event);
        } 
        else if (document.getElementById('signupBusinessForm') && currentPath.includes('auth-signup-business')) {
            const event = new CustomEvent('autopopulate-business-signup', {
                bubbles: true,
                detail: { ...businessSignupData }
            });
            document.getElementById('signupBusinessForm').dispatchEvent(event);
        }
    });
}