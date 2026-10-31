import { CLicenseCard } from "@crystal-creations/crystal-components";

export default {
  title: "Molecules/CLicenseCard",
  component: CLicenseCard,
  args: {
    softwareInfo: {
      name: "Example package",
      version: "1.2.3",
      author: "Example Author",
      repositoryLink: "https://github.com/example/example-package",
      notice: `MIT License

Copyright (c) 2026 Example Author

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the Software), to deal in the Software without restriction.`,
    },
  },
};

export const Default = {};
