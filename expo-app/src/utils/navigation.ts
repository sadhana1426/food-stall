

export const getCanonicalOrderId = (orderOrId: any): string => {
  if (!orderOrId) return '';
  if (typeof orderOrId === 'string') return orderOrId;
  return orderOrId._id || orderOrId.id || '';
};

export const openBillDetails = (router: any, orderOrId: any, replace = false) => {
  const id = getCanonicalOrderId(orderOrId);
  if (!id) {
    console.warn('openBillDetails: No valid order id provided');
    return;
  }
  if (replace) {
    router.replace({ pathname: '/bill-details/[id]', params: { id } });
  } else {
    router.push({ pathname: '/bill-details/[id]', params: { id } });
  }
};
