import { settings, select, classNames, templates } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';
class Cart {
  constructor(element){
    const thisCart = this;
    /*elementy dodane do koszyka*/
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
      
  }
  getElements(element){
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      
    thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
      

  }
  initActions(){
    const thisCart = this;
    /*akcja wywołana na górnej belce koszyka*/
    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      /*toggle na klasie active kontenera cart*/
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){thisCart.update();});
    thisCart.dom.productList.addEventListener('remove', function(){thisCart.remove(event.detail.cartProduct);});
    thisCart.dom.form.addEventListener('submit', function(e){
      e.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct){
    const thisCart = this;
    /*wygenerowanie html za pomocą szablonów, argumentem jest obiekt */
    const generateHtml = templates.cartProduct(menuProduct);
    /* utworzenie elementu DOM z generateHtml */
    const generatedDOM = utils.createDOMFromHTML(generateHtml);
    /*dodajemy element do menu */
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }
  update(){
    const thisCart = this;
    /*koszty dostawy*/
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    /*całkowita liczba zamówień*/
    thisCart.totalNumber = 0;
    /*cena wszystkich produktów*/
    thisCart.subtotalPrice = 0;
    
      
    for(let product of thisCart.products){
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.totalPrice = 0;
    if(this.products.length>0){
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      for(let total of thisCart.dom.totalPrice) {total.innerHTML =thisCart.totalPrice; }
      //thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    }else{thisCart.dom.deliveryFee.innerHTML = 0;
      for(let total of thisCart.dom.totalPrice) {total.innerHTML =thisCart.totalPrice; }}      
      
  }
  remove(element){
    const thisCart = this;
    //Usunięcie reprezentacji produktu z HTML-a,
    element.dom.wrapper.remove();
    //Usunięcie informacji o danym produkcie z tablicy thisCart.products.
    thisCart.products.splice((thisCart.products.indexOf(element)),1); 
    //Wywołać metodę update w celu przeliczenia sum po usunięciu produktu.
      
    thisCart.update();
      
  }
  sendOrder(){
    const thisCart = this;
    //adres endpointu, z którym chcemy się połączyć
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {
      address:thisCart.dom.address.value,
      phone:thisCart.dom.phone.value,
      totalPrice:thisCart.totalPrice,
      subtotalPrice:thisCart.subtotalPrice,
      totalNumber:thisCart.totalNumber,
      deliveryFee:thisCart.deliveryFee,
      products:[],
    };
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options);
  }
    
}
export default Cart;