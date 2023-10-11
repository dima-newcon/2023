const URL_PREFIX = (NAV_ID && NAV_ID == "Home" ? "" : "../");

function createGNB(element) {
  function toggleDropdown() {
    const dropdown = document.querySelector(".gnb-dropdown");
    const gnb = document.querySelector(".gnb");
    dropdown.classList.toggle("gone");
    if (!dropdown.classList.contains("gone")) {
      gnb.classList.add("nav-dropdown");
      document.body.classList.add("nav-dropdown");
    } else {
      gnb.classList.remove("nav-dropdown");
      document.body.classList.remove("nav-dropdown");
    }
  }

  const gnb = document.createElement("header");
  gnb.classList.add("gnb");
  element.replaceWith(gnb);

  const navstuff = document.createElement("div");
  navstuff.className = "gnb-navstuff";
  gnb.appendChild(navstuff);

  const mobileBurger = document.createElement("button");
  mobileBurger.className = "gnb-mobile-burger";
  const mobileBurgerIcon = document.createElement("img");
  mobileBurgerIcon.className = "icon";
  mobileBurgerIcon.src = URL_PREFIX+"res/icons/burger.svg";
  mobileBurger.onclick = toggleDropdown;
  mobileBurger.appendChild(mobileBurgerIcon);
  navstuff.appendChild(mobileBurger);

  const title = document.createElement("a");
  title.href = URL_PREFIX+"";
  title.className = "gnb-title";
  title.textContent = "2023 GYEONGGI ART CENTER X DIMA NEW MEDIA CONTENTS\r\nNEW MEDIA ART EXHIBITION COLLABORATION PROJECT";
  navstuff.appendChild(title);

  const spacing = document.createElement("div");
  spacing.className = "gnb-spacing";
  navstuff.appendChild(spacing);

  const navbar = document.createElement("div");
  navbar.className = "gnb-navbar";
  navstuff.appendChild(navbar);

  const dropdown = document.createElement("div");
  dropdown.className = "gnb-dropdown gone";

  const dropdownTable = document.createElement("table");
  dropdownTable.className = "gnb-dropdown-table";
  dropdown.appendChild(dropdownTable);

  const dropdownLinks = document.createElement("div");
  dropdownLinks.className = "gnb-dropdown-links";
  dropdown.appendChild(dropdownLinks);

  const nav = {
    "Home": "",
    "Introduction": "introduction/",
    "Play": "play/",
    "Address": "address/",
    "Credits": "credits/",
    "Guest Book": "guestbook/"
  };
  let i=0;
  let tr;
  for (let pageTitle in nav) {
    if (i%2==0) {
      tr = document.createElement("tr");
      dropdownTable.appendChild(tr);
    }

    const button = document.createElement("a");
    const dbutton = document.createElement("a");
    button.href = dbutton.href = URL_PREFIX+nav[pageTitle];
    button.className = "gnb-page-link";
    dbutton.className = "gnb-h1 gnb-page-link";
    button.textContent = dbutton.textContent = pageTitle;
    if (NAV_ID && NAV_ID == pageTitle) {
      button.classList.add("current-page");
    } else {
      let td = document.createElement("td");
      td.appendChild(dbutton);
      tr.appendChild(td);
    }
    dbutton.addEventListener("mouseenter", function() {
      dropdownTable.classList.add("hover-child");
    });
    dbutton.addEventListener("mouseleave", function() {
      dropdownTable.classList.remove("hover-child");
    });
    navbar.appendChild(button);

    if (NAV_ID != pageTitle) i++;
  }

  const links = {
    "DIMA Website": {
      img: "res/icons/web.png",
      href: "https://www.dima.ac.kr"
    },
    "Promotional Video": {
      img: "res/icons/youtube.png",
      href: "https://www.youtube.com/watch?v=zHaEQ-tiMZo&ab_channel=%EA%B9%80%EA%B7%9C%EB%A6%AC"
    },
    "Instagram": {
      img: "res/icons/instagram.png",
      href: "https://instagram.com/dima_nm_2023"
    }
  }
  for (let link in links) {
    const anchor = document.createElement("a");
    const icon = document.createElement("img");
    icon.src = URL_PREFIX+links[link].img;
    icon.className = "icon";
    anchor.appendChild(icon);
    const label = document.createElement("span");
    label.textContent = link;
    anchor.appendChild(label);

    anchor.href = links[link].href;
    anchor.target = "_blank";
    dropdownLinks.appendChild(anchor);
  }

  const burger = document.createElement("a");
  burger.addEventListener("click", toggleDropdown);
  burger.className = "gnb-burger gnb-page-link";
  navbar.appendChild(burger);

  gnb.appendChild(dropdown);
}

function createFooter(element) {
  const footer = document.createElement("footer");
  footer.className = "global-footer";

  const logoBar = document.createElement("div");
  logoBar.className = "gf-logo-bar";
  footer.appendChild(logoBar);

  const logos = ["res/logos/ggac.svg", "res/logos/dima.svg", "res/logos/newcon.png"];
  for (let src of logos) {
    const logo = document.createElement("img");
    logo.src = URL_PREFIX+src;
    logoBar.appendChild(logo);
  }

  const title = document.createElement("div");
  title.className = "gf-title";
  const tl1 = document.createElement("div");
  const tl2 = document.createElement("div");
  tl1.textContent = "2023 GYEONGGI ART CENTER X DIMA NEW MEDIA CONTENTS";
  tl2.textContent = "NEW MEDIA ART EXHIBITION COLLABORATION PROJECT";
  title.appendChild(tl1);
  title.appendChild(tl2);
  logoBar.appendChild(title);

  const scrollingBar = document.createElement("div");
  scrollingBar.className = "scrolling-bar";
  const p1 = document.createElement("p");
  const p2 = document.createElement("p");
  const p3 = document.createElement("p");
  p1.textContent = p2.textContent = p3.textContent = "2023 GYEONGGI ART CENTER X DIMA NEW MEDIA CONTENTS NEW MEDIA ART EXHIBITION COLLABORATION PROJECT";
  scrollingBar.appendChild(p1);
  scrollingBar.appendChild(p2);
  scrollingBar.appendChild(p3);
  footer.appendChild(scrollingBar);

  element.replaceWith(footer);
}

function createCD(element) {
  const cd = document.createElement("img");
  cd.className = "main-cd rotate-forever";
  cd.src = URL_PREFIX+"res/maincd.png";
  element.replaceWith(cd);
}

function enableHashReloading() {
  window.onpopstate = function(event) {
    location.reload();
  };
}

var imgDialog;
function createImgDialog() {
  imgDialog = document.createElement("dialog");
  imgDialog.className = "img-dialog";

  let img = document.createElement("img");
  imgDialog.appendChild(img);

  imgDialog.onclick = function() {
    this.close();
  };

  document.body.appendChild(imgDialog);
}
