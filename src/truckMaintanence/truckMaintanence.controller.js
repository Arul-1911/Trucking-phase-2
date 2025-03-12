const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const ApiFeatures = require("../../utils/apiFeatures");
const TruckInspection = require("./truckmaintanence.model");
const InspectionTemplate = require("./truckmaintanenceTemplate.model");
const { isValidObjectId } = require("mongoose");

// =======================================
// CREATE a new truck inspection with global categories
// =======================================
exports.createInspection = catchAsyncError(async (req, res, next) => {
  const { truck_id, driver_id, oil_level } = req.body;

  if (!truck_id || !driver_id || !oil_level) {
    return next(
      new ErrorHandler("Truck ID, Driver ID, and Oil Level are required.", 400)
    );
  }
  if (!isValidObjectId(truck_id) || !isValidObjectId(driver_id)) {
    return next(new ErrorHandler("Invalid Truck ID or Driver ID.", 400));
  }

  // Fetch global categories from template
  const template = await InspectionTemplate.findOne();
  if (!template || !template.categories.length) {
    return next(
      new ErrorHandler(
        "Inspection template not found or empty. Set up global categories first.",
        500
      )
    );
  }

  // Apply default status "Good" to all sub-items
  const categoriesWithDefaultStatus = template.categories.map((category) => ({
    category: category.category,
    sub_items: category.sub_items.map((subItem) => ({
      item: subItem.item,
      status: "Good",
    })),
  }));

  const inspection = await TruckInspection.create({
    truck_id,
    driver_id,
    oil_level,
    inspection_categories: categoriesWithDefaultStatus,
  });

  res.status(201).json({ success: true, inspection });
});

// =======================================
// GET all inspections for a specific truck
// =======================================
exports.getInspectionsByTruck = catchAsyncError(async (req, res, next) => {
  const { truck_id } = req.params;

  if (!isValidObjectId(truck_id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  const inspections = await TruckInspection.find({ truck_id }).populate(
    "truck_id driver_id"
  );
  if (!inspections.length) {
    return next(new ErrorHandler("No inspections found for this truck.", 404));
  }

  res.status(200).json({ success: true, inspections });
});

// =======================================
// GET all inspections (Admin panel)
// =======================================
exports.getAllinsepctions = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeatures(
    TruckInspection.find()
      .populate("truck_id driver_id")
      .sort({ createdAt: -1 }),
    req.query
  );

  let inspections = await apiFeature.query;
  let inspectionsCount = inspections.length;

  res.status(200).json({ success: true, inspections, inspectionsCount });
});

// =======================================
// UPDATE a truck inspection (Only modifies oil level and inspection categories)
// =======================================
exports.updateInspectionByTruck = catchAsyncError(async (req, res, next) => {
  const { truck_id } = req.params;
  const { oil_level, inspection_categories } = req.body;

  if (!isValidObjectId(truck_id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  const inspection = await TruckInspection.findOne({ truck_id });

  if (!inspection) {
    return next(new ErrorHandler("Inspection not found for this truck.", 404));
  }

  // Merge existing categories with new updates
  const updatedCategories = inspection.inspection_categories.map(
    (existingCategory) => {
      const newCategory = inspection_categories.find(
        (c) => c.category === existingCategory.category
      );

      if (newCategory) {
        return newCategory; // Replace with updated category
      } else {
        return existingCategory; // Keep the old category if it's not being updated
      }
    }
  );

  // Add any new categories that didn't exist before
  inspection_categories.forEach((newCategory) => {
    if (
      !updatedCategories.some(
        (existingCategory) => existingCategory.category === newCategory.category
      )
    ) {
      updatedCategories.push(newCategory);
    }
  });

  // Update the document
  inspection.oil_level = oil_level;
  inspection.inspection_categories = updatedCategories;
  await inspection.save();

  res.status(200).json({
    success: true,
    updatedInspection: inspection,
    message: "Truck Inspection updated successfully",
  });
});

// =======================================
// DELETE a truck inspection record
// =======================================
exports.deleteinsoectionByTruck = catchAsyncError(async (req, res, next) => {
  const { truck_id } = req.params;
  if (!isValidObjectId(truck_id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  const inspection = await TruckInspection.findOne({ truck_id });
  if (!inspection) {
    return next(new ErrorHandler("Inspection not found for this truck.", 404));
  }

  await inspection.deleteOne();
  res.status(200).json({ success: true, message: "Inspection deleted" });
});

// =======================================
// UPDATE Global Categories & Sub-Items (sync with all trucks)
// =======================================
exports.updateInspectionTemplate = catchAsyncError(async (req, res, next) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return next(new ErrorHandler("Categories must be a non-empty array", 400));
  }

  let template = await InspectionTemplate.findOne();
  if (template) {
    template.categories = categories;
    await template.save();
  } else {
    template = await InspectionTemplate.create({ categories });
  }

  // Ensure default status "Good" for all sub-items in the new template
  const updatedCategories = categories.map((category) => ({
    category: category.category,
    sub_items: category.sub_items.map((subItem) => ({
      item: subItem.item,
      status: "Good",
    })),
  }));

  // Sync new global categories with all truck inspections
  await TruckInspection.updateMany(
    {},
    { inspection_categories: updatedCategories }
  );

  res.status(200).json({
    success: true,
    template,
    message: "Inspection Template updated successfully",
  });
});

// =======================================
// EDIT a Category Name in the Global Template
// =======================================
exports.editCategoryInTemplate = catchAsyncError(async (req, res, next) => {
  const { oldCategory, newCategory } = req.body;

  if (!oldCategory || !newCategory) {
    return next(
      new ErrorHandler("Old and New Category names are required", 400)
    );
  }

  let template = await InspectionTemplate.findOne();
  if (!template) {
    return next(new ErrorHandler("Inspection Template not found", 404));
  }

  let category = template.categories.find(
    (cat) => cat.category === oldCategory
  );
  if (!category) {
    return next(new ErrorHandler("Old Category not found in Template", 404));
  }

  category.category = newCategory;
  await template.save();

  // Update all truck inspections using arrayFilters to update all matching elements
  await TruckInspection.updateMany(
    { "inspection_categories.category": oldCategory },
    { $set: { "inspection_categories.$[elem].category": newCategory } },
    { arrayFilters: [{ "elem.category": oldCategory }] }
  );

  res.status(200).json({
    success: true,
    template,
    message: "Category name updated successfully",
  });
});

// =======================================
// DELETE a Category (and its sub-items) from the Global Template and sync with inspections
// =======================================
exports.deleteCategoryFromTemplate = catchAsyncError(async (req, res, next) => {
  const { category } = req.body;
  if (!category) {
    return next(new ErrorHandler("Category name is required", 400));
  }

  let template = await InspectionTemplate.findOne();
  if (!template) {
    return next(new ErrorHandler("Inspection Template not found", 404));
  }

  template.categories = template.categories.filter(
    (cat) => cat.category !== category
  );
  await template.save();

  await TruckInspection.updateMany(
    {},
    { $pull: { inspection_categories: { category } } }
  );

  res.status(200).json({
    success: true,
    message: `"${category}" and its sub-items were removed.`,
  });
});

// =======================================
// ADD a new Sub-Item to a Category in the Global Template and sync with inspections
// =======================================
exports.addSubItemToCategory = catchAsyncError(async (req, res, next) => {
  const { category, subItem } = req.body;

  if (!category || !subItem) {
    return next(
      new ErrorHandler("Category name and Sub-item are required", 400)
    );
  }

  let template = await InspectionTemplate.findOne();
  if (!template) {
    return next(new ErrorHandler("Inspection Template not found", 404));
  }

  let categoryObj = template.categories.find(
    (cat) => cat.category === category
  );
  if (!categoryObj) {
    return next(new ErrorHandler("Category not found in Template", 404));
  }

  // Prevent duplicate sub-items
  if (categoryObj.sub_items.some((sub) => sub.item === subItem)) {
    return next(
      new ErrorHandler("Sub-item already exists in this category", 400)
    );
  }

  categoryObj.sub_items.push({ item: subItem });
  await template.save();

  await TruckInspection.updateMany(
    { "inspection_categories.category": category },
    {
      $push: {
        "inspection_categories.$[elem].sub_items": {
          item: subItem,
          status: "Good",
        },
      },
    },
    { arrayFilters: [{ "elem.category": category }] }
  );

  res.status(200).json({
    success: true,
    template,
    message: `Sub-item "${subItem}" added to "${category}".`,
  });
});

// =======================================
// DELETE a specific Sub-Item from a Category in the Global Template and sync with inspections
// =======================================
exports.deleteSubItemFromCategory = catchAsyncError(async (req, res, next) => {
  const { category, subItem } = req.body;

  if (!category || !subItem) {
    return next(
      new ErrorHandler("Category and Sub-Item names are required.", 400)
    );
  }

  let template = await InspectionTemplate.findOne();
  if (!template) {
    return next(new ErrorHandler("Inspection Template not found.", 404));
  }

  let categoryObj = template.categories.find(
    (cat) => cat.category === category
  );
  if (!categoryObj) {
    return next(new ErrorHandler("Category not found.", 404));
  }

  const initialLength = categoryObj.sub_items.length;
  categoryObj.sub_items = categoryObj.sub_items.filter(
    (sub) => sub.item !== subItem
  );
  if (categoryObj.sub_items.length === initialLength) {
    return next(new ErrorHandler("Sub-item not found in this category.", 404));
  }
  await template.save();

  await TruckInspection.updateMany(
    { "inspection_categories.category": category },
    { $pull: { "inspection_categories.$[elem].sub_items": { item: subItem } } },
    { arrayFilters: [{ "elem.category": category }] }
  );

  res.status(200).json({
    success: true,
    message: `"${subItem}" removed from "${category}" category.`,
  });
});
