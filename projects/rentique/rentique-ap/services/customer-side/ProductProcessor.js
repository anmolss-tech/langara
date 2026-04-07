
function getDistance(loc1, loc2) {
    if (!loc1 || !loc2) return Infinity;
    const R = 6371; 
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat) / 2 +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        (1 - Math.cos(dLon)) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

export function processProducts(products, filters, sortOrder, customerLocation, businessLocationMap) {
    console.log("processProducts");
    let processed = [...products];
    processed = processed.filter(product => {
        if (filters.category && filters.category.length > 0) {
            if (!product.category || product.category.length === 0) return false;
            const hasMatchingCategory = product.category.some(pCat => filters.category.includes(pCat));
            if (!hasMatchingCategory) return false;
        }

        if (filters.sizes && filters.sizes.length > 0) {
            if (!product.sizes || product.sizes.length === 0) return true;
            const productSizesLowerCase = product.sizes.map(s => s.toLowerCase());
            const hasMatchingSize = filters.sizes.some(filterSize => 
                productSizesLowerCase.includes(filterSize.toLowerCase())
            );
            if (!hasMatchingSize) return false;
        }

        if (filters.price_min !== undefined && filters.price_max !== undefined) {
             if (product.price < filters.price_min || product.price > filters.price_max) {
                return false;
            }
        }
        
        if (filters.distance && filters.distance > 0) {
            const businessLoc = businessLocationMap.get(product.businessID);
            if (!customerLocation || !businessLoc) return false; 
            const distance = getDistance(customerLocation, businessLoc);
            if (distance > filters.distance) return false;
        }

        if (filters.styles && filters.styles.length > 0) {
            if (!product.styles || product.styles.length === 0) return false;
            const productStylesLower = product.styles.map(s => s.toLowerCase());
            const hasMatchingStyle = filters.styles.some(fStyle => productStylesLower.includes(fStyle.toLowerCase()));
            if (!hasMatchingStyle) return false;
        }

        if (filters.material && filters.material.length > 0) {
            if (!product.material || product.material.length === 0) return false;
            const productMaterialsLower = product.material.map(m => m.toLowerCase());
            const hasMatchingMaterial = filters.material.some(fMat => productMaterialsLower.includes(fMat.toLowerCase()));
            if (!hasMatchingMaterial) return false;
        }

        if (filters.texture && filters.texture.length > 0) {
            if (!product.texture || product.texture.length === 0) return false;
            const productTexturesLower = product.texture.map(t => t.toLowerCase());
            const hasMatchingTexture = filters.texture.some(fTex => productTexturesLower.includes(fTex.toLowerCase()));
            if (!hasMatchingTexture) return false;
        }

        if (filters.season && filters.season.length > 0) {
            if (!product.season || product.season.length === 0) return false;
            const productSeasonsLower = product.season.map(s => s.toLowerCase());
            const hasMatchingSeason = filters.season.some(fSeason => productSeasonsLower.includes(fSeason.toLowerCase()));
            if (!hasMatchingSeason) return false;
        }

        if (filters.color && filters.color.length > 0) {
            if (!product.colors || product.colors.length === 0) return false;
            const productColorsLower = product.colors.map(c => c.toLowerCase());
            const hasMatchingColor = filters.color.some(fColor => productColorsLower.includes(fColor.toLowerCase()));
            if (!hasMatchingColor) return false;
        }

        if (filters.gender && filters.gender.length > 0) {
            if (!product.gender) return false;
            const filterGendersLower = filters.gender.map(g => g.toLowerCase());
            if (!filterGendersLower.includes(product.gender.toLowerCase())) return false;
        }
        return true;
    });
    console.log('80: Sort here')
    switch (sortOrder) {
        case 'low-to-high':
            console.log('case price-asc:')
            processed.sort((a, b) => a.price - b.price);
            break;
            case 'high-to-low':
            console.log('case price-desc:')
            processed.sort((a, b) => b.price - a.price);
            break;
        case 'recent':
        default:
             console.log('case default:')
            processed.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
                return dateB - dateA;
            });
            break;
    }

    return processed;
}