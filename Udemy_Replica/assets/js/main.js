import {
  courses,
  filters,
  footerColumns,
  sortOptions,
  topicTags,
} from "./data.js";

const topicTagsList = document.querySelector("#topic-tags-list");
const filtersList = document.querySelector("#filters-list");
const sortSelect = document.querySelector("#sort-select");
const courseGridList = document.querySelector("#course-grid-list");
const footerGridList = document.querySelector("#footer-grid-list");

const buttonTemplate = (label, className, prefix = "") => `
  <button class="${className}">${prefix}${label}</button>
`;

const courseTemplate = ({
  image,
  alt,
  title,
  description,
  instructor,
  rating,
  stars,
  count,
  meta,
  price,
  oldPrice,
  bestseller,
}) => `
  <article class="course-card">
    <div class="course-image">
      <img src="${image}" alt="${alt}" />
    </div>
    <div class="course-content">
      <h3 class="course-title">${title}</h3>
      <p class="course-description">${description}</p>
      <p class="course-instructor">${instructor}</p>
      <div class="course-rating">
        ${bestseller ? '<span class="bestseller-badge">Bestseller</span>' : ""}
        <span class="rating-number">${rating}</span>
        <span class="stars">${stars}</span>
        <span class="rating-count">${count}</span>
      </div>
      <div class="course-meta">${meta}</div>
      <div class="course-footer">
        <span class="course-price">${price}</span>
        <span class="course-old-price">${oldPrice}</span>
        <button class="btn-add-cart">Add to cart</button>
      </div>
    </div>
  </article>
`;

const footerTemplate = ({ title, links }) => `
  <div class="footer-column">
    <h4>${title}</h4>
    <ul>
      ${links.map((link) => `<li><a href="#">${link}</a></li>`).join("")}
    </ul>
  </div>
`;

topicTagsList.innerHTML = topicTags
  .map((tag) => buttonTemplate(tag, "tag", "→ "))
  .join("");

filtersList.innerHTML = filters
  .map((filterLabel) => buttonTemplate(filterLabel, "filter-btn"))
  .join("");

sortSelect.innerHTML = sortOptions
  .map((option) => `<option>${option}</option>`)
  .join("");

courseGridList.innerHTML = courses.map(courseTemplate).join("");

footerGridList.innerHTML = footerColumns.map(footerTemplate).join("");
